import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import type { AiIntelligenceResponse } from './ai-intelligence.engine';
import type { LlmNarrativeResult } from './ai-llm.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('insights')
  getInsights(@Query() query: Record<string, string | undefined>) {
    return this.aiService.getInsights(query);
  }

  @Get('intelligence')
  getIntelligence(@Query() query: Record<string, string | undefined>): Promise<AiIntelligenceResponse & { llmAvailable: boolean }> {
    return this.aiService.getIntelligence(query);
  }

  @Get('llm-narrative')
  getLlmNarrative(@Query() query: Record<string, string | undefined>): Promise<LlmNarrativeResult & { source?: string; generatedAt?: string }> {
    return this.aiService.getLlmNarrative(query);
  }

  @Get('llm-status')
  getLlmStatus() {
    return this.aiService.getLlmStatus();
  }

  @Post('chat')
  chat(
    @Query() query: Record<string, string | undefined>,
    @Body() body: { message?: string },
  ) {
    return this.aiService.chat(query, body?.message ?? '');
  }
}
