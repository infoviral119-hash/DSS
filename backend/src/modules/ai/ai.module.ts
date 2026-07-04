import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiLlmService } from './ai-llm.service';

@Module({
  controllers: [AiController],
  providers: [AiService, AiLlmService],
  exports: [AiService],
})
export class AiModule {}