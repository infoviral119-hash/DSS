import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ApiKeyService } from '../security/api-key.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private apiKeys: ApiKeyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const apiKeyHeader = (req.headers['x-api-key'] ?? req.headers['x-api-key'.toLowerCase()]) as string | undefined;

    if (apiKeyHeader) {
      const keyUser = await this.apiKeys.validate(apiKeyHeader);
      if (!keyUser) throw new UnauthorizedException('API key tidak valid');
      req.user = {
        id: keyUser.id,
        email: keyUser.email,
        fullName: keyUser.fullName,
        role: keyUser.role,
      };
      req.authVia = 'api_key';
      req.apiKeyId = keyUser.apiKeyId;
      return true;
    }

    const header = req.headers.authorization as string | undefined;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Token tidak ada');

    const user = await this.authService.validateToken(header.slice(7));
    if (!user) throw new UnauthorizedException('Token tidak valid');

    req.user = user;
    req.authVia = 'jwt';
    return true;
  }
}
