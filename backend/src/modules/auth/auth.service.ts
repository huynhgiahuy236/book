import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { Model } from 'mongoose';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import type { AuthUser } from './types/auth-user.type';
import { User } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.users.exists({ email }))
      throw new ConflictException('Email đã được sử dụng');
    const user = await this.users.create({
      name: dto.name.trim(),
      email,
      passwordHash: await hash(dto.password, 12),
    });
    return this.issue(user.id, user.email, user.name, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .findOne({ email: dto.email.trim().toLowerCase() })
      .select('+passwordHash');
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.issue(user.id, user.email, user.name, user.role);
  }

  async profile(id: string) {
    const user = await this.users.findById(id).lean();
    if (!user) throw new UnauthorizedException('Tài khoản không còn tồn tại');
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private async issue(
    id: string,
    email: string,
    name: string,
    role: 'USER' | 'ADMIN',
  ) {
    const payload: AuthUser = { sub: id, email, name, role };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id, email, name, role },
    };
  }
}
