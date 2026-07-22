import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { BooksModule } from './modules/books/books.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AuthModule } from './modules/auth/auth.module';
import { LibraryModule } from './modules/library/library.module';
import { StorageModule } from './modules/storage/storage.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { EngagementModule } from './modules/engagement/engagement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '../.env', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().port().default(4000),
        CLIENT_URL: Joi.string().uri().default('http://localhost:3000'),
        BACKEND_URL: Joi.string().uri().optional(),
        DATABASE_URL: Joi.string().optional(),
        MONGODB_URI: Joi.string().optional(),
        JWT_ACCESS_SECRET: Joi.string().min(24).required(),
        JWT_REFRESH_SECRET: Joi.string().min(24).required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
        PAYOS_ENABLED: Joi.boolean()
          .truthy('true')
          .falsy('false')
          .default(true),
        PAYOS_CLIENT_ID: Joi.string().allow('').optional(),
        PAYOS_API_KEY: Joi.string().allow('').optional(),
        PAYOS_CHECKSUM_KEY: Joi.string().allow('').optional(),
        PAYOS_RETURN_URL: Joi.string().uri().optional(),
        PAYOS_CANCEL_URL: Joi.string().uri().optional(),
        PAYOS_PAYMENT_EXPIRES_MINUTES: Joi.number().positive().default(15),
        PAYOS_WEBHOOK_URL: Joi.string().uri().allow('').optional(),
        BOOK_STORAGE_DRIVER: Joi.string().valid('r2').default('r2'),
        R2_ACCOUNT_ID: Joi.string().required(),
        R2_ACCESS_KEY_ID: Joi.string().required(),
        R2_SECRET_ACCESS_KEY: Joi.string().required(),
        R2_BUCKET_NAME: Joi.string().required(),
        R2_ENDPOINT: Joi.string()
          .uri({ scheme: ['https'] })
          .pattern(/^https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/?$/)
          .required(),
        R2_REGION: Joi.string().default('auto'),
        ALLOW_EBOOK_DOWNLOAD: Joi.boolean()
          .truthy('true')
          .falsy('false')
          .default(false),
        MAX_EBOOK_SIZE_MB: Joi.number().positive().default(50),
        EMAIL_ENABLED: Joi.boolean()
          .truthy('true')
          .falsy('false')
          .default(false),
        GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().allow('').optional(),
        GMAIL_CLIENT_ID: Joi.string().allow('').optional(),
        GMAIL_CLIENT_SECRET: Joi.string().allow('').optional(),
        GMAIL_REFRESH_TOKEN: Joi.string().allow('').optional(),
        GMAIL_SENDER_EMAIL: Joi.string().email().allow('').optional(),
        MAIL_FROM_NAME: Joi.string().default('CapstoneBook'),
        AI_ENABLED: Joi.boolean()
          .truthy('true')
          .falsy('false')
          .default(false),
        AI_PROVIDER: Joi.string().valid('openai').default('openai'),
        OPENAI_API_KEY: Joi.string().allow('').optional(),
        OPENAI_MODEL: Joi.string().default('gpt-4.1-mini'),
        AI_MAX_OUTPUT_TOKENS: Joi.number().integer().positive().default(500),
        AI_REQUEST_TIMEOUT_MS: Joi.number().integer().positive().default(20000),
      }).or('DATABASE_URL', 'MONGODB_URI'),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('DATABASE_URL') ??
          config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    BooksModule,
    StorageModule,
    LibraryModule,
    PaymentsModule,
    AiModule,
    AdminModule,
    EngagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
