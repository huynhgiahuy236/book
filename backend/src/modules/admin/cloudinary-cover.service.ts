import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryCoverService {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  upload(content: Buffer, slug: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'capstonebook/covers',
          public_id: `${slug}-${Date.now()}`,
          resource_type: 'image',
          overwrite: false,
          transformation: [{ width: 1200, height: 1800, crop: 'limit' }],
        },
        (error, result) => {
          if (error || !result)
            reject(new BadGatewayException('Không thể tải ảnh lên Cloudinary'));
          else resolve(result);
        },
      );
      stream.end(content);
    });
  }

  async delete(publicId?: string | null) {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  }
}
