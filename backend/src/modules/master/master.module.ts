import { Module } from '@nestjs/common';
import { MasterController } from './master.controller';
import { CasesModule } from '../cases/cases.module';

@Module({
  imports: [CasesModule],
  controllers: [MasterController],
})
export class MasterModule {}
