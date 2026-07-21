import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      service: 'capstonebook-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
