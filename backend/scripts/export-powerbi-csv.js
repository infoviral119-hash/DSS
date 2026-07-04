const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const url = process.env.DATABASE_URL ||
    'postgresql://postgres:medSkUipaLACNuyr@db.vnfndvbxhvpikjxvnkmc.supabase.co:5432/postgres';
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const { rows } = await client.query(
    `SELECT nomor_register, tanggal, nama_korban, jenis_kelamin, usia, jenis_kekerasan,
     kabupaten, kecamatan, kelurahan, status, psikolog_nama, tahun, kategori
     FROM cases ORDER BY tanggal`,
  );
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const esc = (v) => {
    const s = String(v ?? '');
    return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))];
  const out = path.resolve(__dirname, '../../doc/powerbi_cases.csv');
  fs.writeFileSync(out, `\uFEFF${lines.join('\n')}`);
  console.log(`OK: ${rows.length} baris -> ${out}`);
  await client.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
