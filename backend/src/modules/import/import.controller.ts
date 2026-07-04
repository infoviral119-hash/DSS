import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';

@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  preview(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File wajib diupload.');
    return this.importService.createPreview(file.buffer, file.originalname);
  }

  @Post('validate')
  validate(@Body() body: { batchId: string; mapping: Record<string, string>; tahun?: number }) {
    return this.importService.validateBatch(body.batchId, body.mapping, body.tahun);
  }

  @Post('execute')
  execute(@Body() body: { batchId: string; skipDuplicates?: boolean }) {
    return this.importService.executeImport(body.batchId, body.skipDuplicates ?? true);
  }

  @Post('rollback/:batchId')
  rollback(@Param('batchId') batchId: string) {
    return this.importService.rollback(batchId);
  }

  @Get('history')
  getHistory() {
    return this.importService.getHistory();
  }

  @Get('log/:batchId')
  getLog(@Param('batchId') batchId: string) {
    return this.importService.getBatchLog(batchId);
  }

  @Get('doc-files')
  listDocFiles() {
    return this.importService.listDocFiles();
  }

  @Post('doc-folder')
  importDocFolder() {
    return this.importService.importDocFolder();
  }

  @Get('batch/:batchId')
  getBatch(@Param('batchId') batchId: string) {
    return this.importService.getBatch(batchId);
  }
}
