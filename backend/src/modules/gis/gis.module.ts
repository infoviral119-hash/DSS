import { Module } from '@nestjs/common';
import { CasesModule } from '../cases/cases.module';
import { GisController } from './gis.controller';
import { GisService } from './gis.service';

@Module({
  imports: [CasesModule],
  controllers: [GisController],
  providers: [GisService],
  exports: [GisService],
})
export class GisModule {}
