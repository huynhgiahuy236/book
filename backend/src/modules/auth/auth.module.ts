import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User, UserSchema } from './schemas/user.schema';
import { AuthSession, AuthSessionSchema } from './schemas/auth-session.schema';
import { PasswordResetOtp, PasswordResetOtpSchema } from './schemas/password-reset-otp.schema';
import { MailService } from './mail.service';
import { AdminGuard } from './guards/admin.guard';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthSession.name, schema: AuthSessionSchema },
      { name: PasswordResetOtp.name, schema: PasswordResetOtpSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_ACCESS_EXPIRES_IN',
            '15m',
          ) as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, AdminGuard, RateLimitService, MailService],
  exports: [AuthService, JwtAuthGuard, AdminGuard, RateLimitService, JwtModule],
})
export class AuthModule {}
