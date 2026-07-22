import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { AuthUser } from './types/auth-user.type';
import { RateLimitService } from './rate-limit.service';
import { tokenDurationMs } from './token-duration';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly limiter: RateLimitService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.limiter.hit('register', dto.email, 5, 15 * 60_000);
    return this.withRefreshCookie(response, await this.auth.register(dto));
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.limiter.hit('login', dto.email, 10, 15 * 60_000);
    return this.withRefreshCookie(response, await this.auth.login(dto));
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withRefreshCookie(
      response,
      await this.auth.refresh(this.cookie(request, 'capstone_refresh')),
    );
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.logout(
      this.cookie(request, 'capstone_refresh'),
    );
    response.clearCookie('capstone_refresh', { path: '/api/v1/auth' });
    return result;
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    this.limiter.hit('forgot', dto.email, 3, 15 * 60_000);
    return this.auth.forgotPassword(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    this.limiter.hit('otp', dto.email, 8, 15 * 60_000);
    return this.auth.verifyOtp(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Get('google')
  async google(@Query('next') next: string, @Res() response: Response) {
    response.redirect(await this.auth.googleAuthorizationUrl(next));
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() response: Response,
  ) {
    const result = await this.auth.googleCallback(code, state);
    this.setRefreshCookie(response, result.refreshToken);
    const client = this.config.get<string>(
      'CLIENT_URL',
      'http://localhost:3000',
    );
    response.redirect(
      `${client}/auth/google/callback#accessToken=${encodeURIComponent(result.accessToken)}&next=${encodeURIComponent(result.next)}`,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.profile(user.sub);
  }

  private withRefreshCookie(
    response: Response,
    result: Awaited<ReturnType<AuthService['login']>>,
  ) {
    this.setRefreshCookie(response, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie('capstone_refresh', token, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: tokenDurationMs(
        this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
        '30d',
      ),
    });
  }

  private cookie(request: Request, name: string) {
    const entry = request.headers.cookie
      ?.split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`));
    return entry ? decodeURIComponent(entry.slice(name.length + 1)) : '';
  }
}
