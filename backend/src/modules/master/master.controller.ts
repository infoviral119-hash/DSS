import { Controller, Get } from '@nestjs/common';
import { CasesService } from '../cases/cases.service';

@Controller('master')
export class MasterController {
  constructor(private casesService: CasesService) {}

  @Get()
  async getMasterData() {
    const options = await this.casesService.getFilterOptions();
    const { data } = await this.casesService.findAll({ limit: '5000' });

    const uniq = (field: string) => {
      const set = new Set<string>();
      for (const row of data) {
        const val = (row as Record<string, unknown>)[field];
        if (val) set.add(String(val));
      }
      return [...set].sort();
    };

    const psikologCount: Record<string, number> = {};
    for (const row of data) {
      const p = String((row as Record<string, unknown>).psikolog_nama || 'Belum ditugaskan');
      psikologCount[p] = (psikologCount[p] ?? 0) + 1;
    }

    return {
      kabupaten: options.kabupaten,
      jenisKekerasan: options.jenisKekerasan,
      status: options.status,
      kategori: uniq('kategori'),
      kecamatan: uniq('kecamatan'),
      psikolog: Object.entries(psikologCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
