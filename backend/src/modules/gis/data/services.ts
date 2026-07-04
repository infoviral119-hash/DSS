export type ServiceCategory =
  | 'rumah_sakit'
  | 'polsek'
  | 'lbh'
  | 'shelter'
  | 'psikolog'
  | 'p2tp2a'
  | 'kejaksaan'
  | 'pengadilan'
  | 'puskesmas';

export interface PublicService {
  id: string;
  name: string;
  category: ServiceCategory;
  lat: number;
  lng: number;
  address?: string;
}

export const PUBLIC_SERVICES: PublicService[] = [
  { id: 'rs-1', name: 'RSUD Kota Bandung', category: 'rumah_sakit', lat: -6.9147, lng: 107.6098, address: 'Jl. Kebonjati, Bandung' },
  { id: 'rs-2', name: 'RS Hasan Sadikin', category: 'rumah_sakit', lat: -6.9012, lng: 107.5855, address: 'Jl. Pasteur, Bandung' },
  { id: 'rs-3', name: 'RSUD Lombok Barat', category: 'rumah_sakit', lat: -8.5833, lng: 116.1167, address: 'Mataram' },
  { id: 'pol-1', name: 'Polresta Bandung', category: 'polsek', lat: -6.9201, lng: 107.6185 },
  { id: 'pol-2', name: 'Polsek Batujajar', category: 'polsek', lat: -6.893, lng: 107.505 },
  { id: 'pol-3', name: 'Polres Lombok Barat', category: 'polsek', lat: -8.584, lng: 116.118 },
  { id: 'lbh-1', name: 'LBH Bandung', category: 'lbh', lat: -6.905, lng: 107.612 },
  { id: 'lbh-2', name: 'LBH Mataram', category: 'lbh', lat: -8.582, lng: 116.115 },
  { id: 'sh-1', name: 'Rumah Aman Bandung', category: 'shelter', lat: -6.928, lng: 107.635 },
  { id: 'sh-2', name: 'Rumah Aman NTB', category: 'shelter', lat: -8.59, lng: 116.12 },
  { id: 'psi-1', name: 'Klinik Psikolog Bandung', category: 'psikolog', lat: -6.915, lng: 107.625 },
  { id: 'psi-2', name: 'Psikolog Mataram', category: 'psikolog', lat: -8.581, lng: 116.11 },
  { id: 'p2-1', name: 'P2TP2A Jawa Barat', category: 'p2tp2a', lat: -6.91, lng: 107.62 },
  { id: 'p2-2', name: 'P2TP2A NTB', category: 'p2tp2a', lat: -8.585, lng: 116.117 },
  { id: 'kej-1', name: 'Kejaksaan Negeri Bandung', category: 'kejaksaan', lat: -6.918, lng: 107.61 },
  { id: 'pn-1', name: 'Pengadilan Negeri Bandung', category: 'pengadilan', lat: -6.922, lng: 107.615 },
  { id: 'pk-1', name: 'Puskesmas Batujajar', category: 'puskesmas', lat: -6.895, lng: 107.508 },
  { id: 'pk-2', name: 'Puskesmas Cimahi', category: 'puskesmas', lat: -6.884, lng: 107.542 },
];
