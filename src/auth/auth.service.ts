import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantService } from '../tenant/tenant.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private tenantService: TenantService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
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
