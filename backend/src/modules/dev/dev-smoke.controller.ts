import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { DevSmokeService } from './dev-smoke.service';

@Public()
@Controller('dev')
export class DevSmokeController {
  constructor(private smoke: DevSmokeService) {}

  @Get('smoke')
  run() {
    return this.smoke.run();
  }
}
