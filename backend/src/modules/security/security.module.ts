import { Global, Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { MfaService } from './mfa.service';
import { PermissionsGuard } from './permissions.guard';
import { EmailService } from './email.service';
import { ApiKeyService } from './api-key.service';
import { NotificationService } from './notification.service';
import { SchedulerService } from './scheduler.service';

@Global()
@Module({
  imports: [SupabaseModule],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    MfaService,
    PermissionsGuard,
    EmailService,
    ApiKeyService,
    NotificationService,
    SchedulerService,
  ],
  exports: [
    SecurityService,
    MfaService,
    PermissionsGuard,
    ApiKeyService,
    NotificationService,
    EmailService,
  ],
})
export class SecurityModule {}
