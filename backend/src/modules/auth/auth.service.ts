import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomInt, randomUUID } from 'node:crypto';
import { Model } from 'mongoose';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { MailService } from './mail.service';
import { AuthSession } from './schemas/auth-session.schema';
import { PasswordResetOtp } from './schemas/password-reset-otp.schema';
import { User } from './schemas/user.schema';
import type { AuthUser } from './types/auth-user.type';

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: 'USER' | 'ADMIN' };
};

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(AuthSession.name)
    private readonly sessions: Model<AuthSession>,
    @InjectModel(PasswordResetOtp.name)
    private readonly resetOtps: Model<PasswordResetOtp>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword)
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    const email = dto.email.trim().toLowerCase();
    if (await this.users.exists({ email }))
      throw new ConflictException('Email đã được sử dụng');
    const user = await this.users.create({
      name: dto.name.trim(),
      email,
      passwordHash: await hash(dto.password, 12),
      provider: 'LOCAL',
      emailVerified: false,
    });
    return this.issue(user.id, user.email, user.name, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .findOne({ email: dto.email.trim().toLowerCase() })
      .select('+passwordHash');
    if (
      !user ||
      !user.passwordHash ||
      !(await compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    if (user.status === 'LOCKED')
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    return this.issue(user.id, user.email, user.name, user.role);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Thiếu refresh token');
    const payload = await this.jwt
      .verifyAsync<AuthUser & { jti: string; type: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      })
      .catch(() => null);
    if (!payload || payload.type !== 'refresh')
      throw new UnauthorizedException('Refresh token không hợp lệ');
    const session = await this.sessions
      .findOne({ jti: payload.jti, userId: payload.sub, revokedAt: null })
      .select('+tokenHash');
    if (!session || !(await compare(refreshToken, session.tokenHash)))
      throw new UnauthorizedException('Phiên đăng nhập không còn hiệu lực');
    const user = await this.users.findById(payload.sub);
    if (!user || user.status === 'LOCKED')
      throw new UnauthorizedException('Tài khoản không còn hiệu lực');
    session.revokedAt = new Date();
    await session.save();
    return this.issue(user.id, user.email, user.name, user.role);
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      const payload = await this.jwt
        .verifyAsync<{ jti: string }>(refreshToken, {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          ignoreExpiration: true,
        })
        .catch(() => null);
      if (payload?.jti)
        await this.sessions.updateOne(
          { jti: payload.jti },
          { $set: { revokedAt: new Date() } },
        );
    }
    return { success: true };
  }

  async profile(id: string) {
    const user = await this.users.findById(id).lean();
    if (!user) throw new UnauthorizedException('Tài khoản không còn tồn tại');
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    if (!this.config.get<boolean>('EMAIL_ENABLED', false)) {
      throw new BadRequestException(
        'Dịch vụ email đang tắt. Bật EMAIL_ENABLED để gửi OTP.',
      );
    }
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.exists({ email });
    if (!user)
      return {
        success: true,
        message: 'Nếu email tồn tại, mã OTP sẽ được gửi.',
      };
    const otp = String(randomInt(100000, 1000000));
    await this.resetOtps.findOneAndUpdate(
      { email },
      {
        $set: {
          codeHash: await hash(otp, 10),
          expiresAt: new Date(Date.now() + 10 * 60_000),
          attempts: 0,
          consumedAt: null,
        },
      },
      { upsert: true, new: true },
    );
    try {
      await this.mail.sendPasswordResetOtp(email, otp);
    } catch (error) {
      await this.resetOtps.deleteOne({ email });
      throw error;
    }
    return { success: true, message: 'Nếu email tồn tại, mã OTP sẽ được gửi.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const email = dto.email.trim().toLowerCase();
    const record = await this.resetOtps
      .findOne({ email, consumedAt: null })
      .select('+codeHash');
    if (!record || record.expiresAt < new Date() || record.attempts >= 5)
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    if (!(await compare(dto.otp, record.codeHash))) {
      await this.resetOtps.updateOne(
        { _id: record._id },
        { $inc: { attempts: 1 } },
      );
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }
    record.consumedAt = new Date();
    await record.save();
    return {
      resetToken: await this.jwt.signAsync(
        { sub: email, type: 'password-reset' },
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: '10m',
        },
      ),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword)
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    const payload = await this.jwt
      .verifyAsync<{ sub: string; type: string }>(dto.resetToken, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      })
      .catch(() => null);
    if (!payload || payload.type !== 'password-reset')
      throw new BadRequestException('Phiên đặt lại mật khẩu không hợp lệ');
    const user = await this.users.findOneAndUpdate(
      { email: payload.sub },
      {
        $set: { passwordHash: await hash(dto.password, 12), provider: 'LOCAL' },
      },
      { new: true },
    );
    if (!user) throw new BadRequestException('Tài khoản không tồn tại');
    await this.sessions.updateMany(
      { userId: user.id, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    return { success: true };
  }

  async googleAuthorizationUrl(next = '/library') {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const callback = this.config.get<string>('GOOGLE_CALLBACK_URL');
    if (!clientId || !callback)
      throw new BadRequestException('Google OAuth chưa được cấu hình');
    const safeNext =
      next.startsWith('/') && !next.startsWith('//') ? next : '/library';
    const state = await this.jwt.signAsync(
      { next: safeNext, type: 'google-state' },
      { expiresIn: '10m' },
    );
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callback,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async googleCallback(code: string, state: string) {
    const statePayload = await this.jwt
      .verifyAsync<{ next: string; type: string }>(state)
      .catch(() => null);
    if (!statePayload || statePayload.type !== 'google-state')
      throw new BadRequestException('Google OAuth state không hợp lệ');
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.config.getOrThrow<string>('GOOGLE_CALLBACK_URL');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const token = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenResponse.ok || !token.access_token)
      throw new UnauthorizedException('Không thể xác thực với Google');
    const profileResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    );
    const profile = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
    };
    if (!profileResponse.ok || !profile.sub || !profile.email)
      throw new UnauthorizedException('Không thể lấy hồ sơ Google');
    const email = profile.email.toLowerCase();
    const user = await this.users.findOneAndUpdate(
      { email },
      {
        $set: {
          googleId: profile.sub,
          name: profile.name || email.split('@')[0],
          avatarUrl: profile.picture ?? null,
          emailVerified: Boolean(profile.email_verified),
        },
        $setOnInsert: { provider: 'GOOGLE', role: 'USER' },
      },
      { upsert: true, new: true },
    );
    if (!user)
      throw new UnauthorizedException('Không thể tạo tài khoản Google');
    return {
      ...(await this.issue(user.id, user.email, user.name, user.role)),
      next: statePayload.next,
    };
  }

  private async issue(
    id: string,
    email: string,
    name: string,
    role: 'USER' | 'ADMIN',
  ): Promise<TokenPair> {
    const payload: AuthUser = { sub: id, email, name, role };
    const jti = randomUUID();
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(
      { ...payload, jti, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '30d',
        ) as never,
      },
    );
    await this.sessions.create({
      userId: id,
      jti,
      tokenHash: await hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000),
    });
    return { accessToken, refreshToken, user: { id, email, name, role } };
  }
}
