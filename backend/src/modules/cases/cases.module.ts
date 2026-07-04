import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { CasesController } from './cases.controller';
import { CaseManagementController } from './case-management.controller';
import { CasesService } from './cases.service';
import { CaseManagementService } from './case-management.service';

@Module({
  imports: [SupabaseModule],
  controllers: [CasesController, CaseManagementController],
  providers: [CasesService, CaseManagementService],
  exports: [CasesService, CaseManagementService],
})
export class CasesModule {}