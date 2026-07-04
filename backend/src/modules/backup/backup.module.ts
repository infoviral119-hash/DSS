import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { SecurityModule } from '../security/security.module';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupStorageService } from './backup-storage.service';

@Module({
  imports: [SupabaseModule, SecurityModule],
  controllers: [BackupController],
  providers: [BackupService, BackupStorageService],
  exports: [BackupService],
})
export class BackupModule {}
