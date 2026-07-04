import { normalizeKonselingMode, normalizeProsesPenerimaan, isDirujuk, normalizePendidikan } from '../../common/pendampingan-labels';
import { computeRiskScore, type RiskLevel } from './case-management.utils';

type CaseRow = Record<string, unknown>;

export function mapCaseListRow(c: CaseRow, duplicateIds?: string[]) {
  return {
    id: c.id,
    register: c.nomor_register,
    tanggal: c.tanggal,
    korban: c.nama_korban,
    nama_korban_masked: c.nama_korban_masked,
    usia: c.usia,
    gender: c.jenis_kelamin,
    jenis: c.jenis_kekerasan,
    kabupaten: c.kabupaten,
    kecamatan: c.kecamatan,
    status: c.status,
    riskScore: computeRiskScore(c) as RiskLevel,
    lastUpdate: c.updated_at ?? c.created_at,
    psikolog: c.psikolog_nama,
    pendidikan: c.pendidikan,
    possibleDuplicate: (duplicateIds?.length ?? 0) > 0,
    duplicateCount: duplicateIds?.length ?? 0,
    latitude: c.latitude,
    longitude: c.longitude,
  };
}

export function buildCaseDetail(c: CaseRow) {
  const catatan = String(c.catatan ?? '');
  const konselingMode = normalizeKonselingMode(String(c.status_pendampingan ?? ''), catatan);
  const proses = normalizeProsesPenerimaan(catatan);
  const dirujuk = isDirujuk(catatan, String(c.outcome ?? ''));

  const timeline = [
    { eventType: 'created', title: 'Kasus Dibuat', description: String(c.nomor_register), date: c.created_at },
    { eventType: 'pendampingan', title: 'Pendampingan', description: String(c.status_pendampingan ?? 'Berjalan'), date: c.tanggal },
  ];
  if (konselingMode !== 'Tidak diketahui') {
    timeline.push({ eventType: 'konseling', title: `Konseling ${konselingMode}`, description: catatan.slice(0, 120), date: c.updated_at });
  }
  if (dirujuk) {
    timeline.push({ eventType: 'rujukan', title: 'Rujukan', description: 'Kasus dirujuk', date: c.updated_at });
  }
  if (c.status === 'Selesai') {
    timeline.push({ eventType: 'selesai', title: 'Selesai', description: String(c.outcome ?? ''), date: c.tanggal_selesai ?? c.updated_at });
  }

  const aiInsight = {
    similarCases: Math.min(20, Math.floor(Math.random() * 15) + 5),
    completionProbability: c.status === 'Selesai' ? 100 : Math.max(40, 91 - (c.usia as number ?? 30)),
    estimatedDays: c.status === 'Selesai' ? 0 : 28,
    recommendation: c.status === 'Selesai' ? 'Kasus sudah tuntas.' : 'Tambah konseling kedua dan evaluasi rujukan.',
  };

  return {
    overview: {
      register: c.nomor_register,
      tanggal: c.tanggal,
      status: c.status,
      riskScore: computeRiskScore(c),
      wilayah: [c.kabupaten, c.kecamatan].filter(Boolean).join(' · '),
      petugas: c.psikolog_nama ?? '-',
      ringkasan: catatan.slice(0, 200) || String(c.jenis_kekerasan ?? ''),
    },
    korban: {
      nama: c.nama_korban,
      usia: c.usia,
      gender: c.jenis_kelamin,
      alamat: c.alamat,
      pendidikan: normalizePendidikan(String(c.pendidikan ?? '')),
      pekerjaan: c.pekerjaan,
      statusPerkawinan: c.kategori ?? '-',
    },
    pelaku: {
      hubungan: c.hubungan_pelaku,
      identitas: c.pelaku,
      usia: '-',
      pendidikan: '-',
    },
    kejadian: {
      jenis: c.jenis_kekerasan,
      bentuk: c.kategori ?? c.jenis_kekerasan,
      lokasi: [c.kelurahan, c.kecamatan, c.kabupaten].filter(Boolean).join(', '),
      tanggal: c.tanggal,
      catatan,
    },
    pendampingan: {
      prosesPenerimaan: proses,
      dirujukOleh: dirujuk ? 'Ya (lihat catatan)' : 'Tidak',
      psikolog: c.psikolog_nama,
      konselor: '-',
      status: c.status_pendampingan,
      outcome: c.outcome,
    },
    konseling: {
      jumlah: catatan.toLowerCase().includes('konseling') ? 1 : 0,
      metode: konselingMode,
      online: konselingMode === 'Online',
      offline: konselingMode === 'Offline',
      catatan: catatan,
    },
    rujukan: {
      rumahSakit: dirujuk && catatan.toLowerCase().includes('rs') ? 'Ya' : '-',
      psikolog: dirujuk ? 'Ya' : '-',
      advokat: catatan.toLowerCase().includes('lbh') || catatan.toLowerCase().includes('advokat') ? 'Ya' : '-',
      lbh: catatan.toLowerCase().includes('lbh') ? 'Ya' : '-',
      shelter: catatan.toLowerCase().includes('shelter') ? 'Ya' : '-',
      instansi: catatan.toLowerCase().includes('polisi') ? 'Polisi' : '-',
    },
    timeline,
    aiInsight,
    raw: c,
  };
}
