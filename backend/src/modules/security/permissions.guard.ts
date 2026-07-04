import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../auth/roles.decorator';
import { SKIP_PERMISSIONS_KEY } from '../auth/roles.decorator';
import { SecurityService } from './security.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private security: SecurityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { role?: string } | undefined;
    if (!user?.role) throw new ForbiddenException('Akses ditolak');
    if (user.role === 'admin') return true;

    const perms = await this.security.getUserPermissions(user.role);
    if (required.some((p) => perms.includes(p))) return true;
    throw new ForbiddenException('Permission tidak cukup');
  }
}
