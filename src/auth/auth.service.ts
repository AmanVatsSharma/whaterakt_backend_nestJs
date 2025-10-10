import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantService } from '../tenant/tenant.service';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tenantService: TenantService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async signup(email: string, password: string, tenantName: string) {
    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new BadRequestException('Email already registered');

    const tenant = await this.tenantService.createTenant({ name: tenantName });
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        tenantId: tenant.id,
      },
    });
    return this.login(user);
  }

  async login(user: any) {
    const tenant = await this.tenantService.findById(user.tenantId);
    const payload = { 
      email: user.email, 
      sub: user.id,
      tenantId: user.tenantId
    };
    return {
      access_token: this.jwtService.sign(payload),
      tenant,
    };
  }
}
