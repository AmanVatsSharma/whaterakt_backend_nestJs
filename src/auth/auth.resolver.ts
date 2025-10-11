import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthPayload } from './entities/auth.entity';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Returns JWT and tenant' })
  async login(@Args('input') input: LoginInput) {
    const user = await this.authService.validateUser(input.email, input.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Mutation(() => AuthPayload)
  @ApiOperation({ summary: 'Signup and create a tenant' })
  @ApiOkResponse({ description: 'Returns JWT and tenant' })
  async signup(@Args('input') input: SignupInput) {
    return this.authService.signup(input.email, input.password, input.tenantName);
  }
}
