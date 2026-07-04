import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { SKIP_ROLES_KEY } from './skip-roles.decorator';

const ROLE_MAP: Record<string, string[]> = {
  admin: ['super_admin', 'system_admin', 'admin'],
  operator: ['operator'],
  supervisor: ['supervisor', 'supervisor'],
  auditor: ['auditor'],
  direktur: ['executive', 'direktur'],
  ketua_yayasan: ['executive'],
  psikolog: ['operator', 'analyst'],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { role?: string } | undefined;
    if (!user?.role) throw new ForbiddenException('Akses ditolak');

    const userRoles = new Set([
      user.role,
      ...(ROLE_MAP[user.role] ?? []),
    ]);

    if (required.some((r) => userRoles.has(r))) return true;
    throw new ForbiddenException('Role tidak memiliki akses');
  }
}
