import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private readonly config: ConfigService) {}

  async sendPasswordResetOtp(email: string, otp: string) {
    if (!this.config.get<boolean>('EMAIL_ENABLED', false)) {
      throw new BadRequestException('Dịch vụ email đang tắt. Bật EMAIL_ENABLED để gửi OTP.');
    }
    const clientId = this.config.get<string>('GMAIL_CLIENT_ID');
    const clientSecret = this.config.get<string>('GMAIL_CLIENT_SECRET');
    const refreshToken = this.config.get<string>('GMAIL_REFRESH_TOKEN');
    const sender = this.config.get<string>('GMAIL_SENDER_EMAIL');
    if (!clientId || !clientSecret || !refreshToken || !sender) {
      throw new BadRequestException('Cấu hình Gmail OAuth chưa đầy đủ');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
    });
    const tokenPayload = await tokenResponse.json() as { access_token?: string };
    if (!tokenResponse.ok || !tokenPayload.access_token) throw new BadRequestException('Không thể xác thực dịch vụ Gmail');

    const fromName = this.config.get<string>('MAIL_FROM_NAME', 'CapstoneBook');
    const raw = [
      `From: ${fromName} <${sender}>`, `To: ${email}`,
      'Subject: =?UTF-8?B?' + Buffer.from('Mã xác minh CapstoneBook').toString('base64') + '?=',
      'MIME-Version: 1.0', 'Content-Type: text/plain; charset=UTF-8', '',
      `Mã OTP đặt lại mật khẩu của bạn là: ${otp}\nMã có hiệu lực trong 10 phút. Không chia sẻ mã này.`,
    ].join('\r\n');
    const encoded = Buffer.from(raw).toString('base64url');
    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPayload.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded }),
    });
    if (!sendResponse.ok) throw new BadRequestException('Không thể gửi email OTP');
  }
}
