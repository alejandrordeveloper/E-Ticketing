import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type AuthenticatedRequest = {
  user?: {
    email?: string
    is_staff?: boolean
  }
}

@Injectable()
export class BackstageAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const backstageAdminEmail = this.configService.get<string>('BACKSTAGE_ADMIN_EMAIL')?.trim().toLowerCase()

    if (!request.user) {
      throw new UnauthorizedException('Missing authenticated user context')
    }

    const tokenEmail = request.user.email?.trim().toLowerCase()
    const isStaff = request.user.is_staff === true

    if (isStaff || (backstageAdminEmail && tokenEmail === backstageAdminEmail)) {
      return true
    }

    throw new ForbiddenException('Backstage access requires the demo admin account')
  }
}