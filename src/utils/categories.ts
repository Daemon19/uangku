import type { CategoryItem } from '@/db/types';

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'makanan',
    name: 'Makanan',
    icon: 'Utensils',
    emoji: '🍱',
    keywords: ['makanan', 'makan', 'minum', 'kopi', 'resto', 'warung', 'gofood', 'grabfood', 'sarapan', 'siang', 'malam', 'camilan', 'snack'],
    defaultType: 'tunai',
    color: '#D97706',
    bgLight: '#FEF3C7',
  },
  {
    id: 'transportasi',
    name: 'Transportasi',
    icon: 'Car',
    emoji: '🚕',
    keywords: ['transportasi', 'trans', 'ojek', 'grab', 'gojek', 'bensin', 'tol', 'parkir', 'bus', 'kereta', 'mrt'],
    defaultType: 'rekening',
    color: '#2563EB',
    bgLight: '#DBEAFE',
  },
  {
    id: 'tagihan',
    name: 'Tagihan',
    icon: 'Zap',
    emoji: '💡',
    keywords: ['tagihan', 'listrik', 'air', 'pdam', 'wifi', 'indihome', 'pulsa', 'kuota', 'langganan'],
    defaultType: 'rekening',
    color: '#EAB308',
    bgLight: '#FEF9C3',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'ShoppingBag',
    emoji: '🛍️',
    keywords: ['shopping', 'belanja', 'baju', 'sepatu', 'tokped', 'shopee', 'mall'],
    defaultType: 'rekening',
    color: '#EC4899',
    bgLight: '#FCE7F3',
  },
  {
    id: 'hiburan',
    name: 'Hiburan',
    icon: 'Gamepad2',
    emoji: '🎬',
    keywords: ['hiburan', 'bioskop', 'game', 'nonton', 'netflix', 'spotify', 'main', 'steam'],
    defaultType: 'rekening',
    color: '#8B5CF6',
    bgLight: '#EDE9FE',
  },
  {
    id: 'kesehatan',
    name: 'Kesehatan',
    icon: 'HeartPulse',
    emoji: '💊',
    keywords: ['kesehatan', 'obat', 'dokter', 'apotek', 'vitamin', 'rs', 'sakit', 'klinik'],
    defaultType: 'tunai',
    color: '#EF4444',
    bgLight: '#FEE2E2',
  },
  {
    id: 'edukasi',
    name: 'Edukasi',
    icon: 'GraduationCap',
    emoji: '📚',
    keywords: ['edukasi', 'buku', 'kursus', 'sekolah', 'kuliah', 'spp', 'udemy', 'les'],
    defaultType: 'rekening',
    color: '#0D9488',
    bgLight: '#CCFBF1',
  },
  {
    id: 'hutang',
    name: 'Hutang',
    icon: 'Handshake',
    emoji: '🤝',
    keywords: ['hutang', 'pinjam', 'bayar hutang', 'cicilan', 'arisan', 'pinjol'],
    defaultType: 'rekening',
    color: '#EA580C',
    bgLight: '#FFEDD5',
  },
  {
    id: 'lainnya',
    name: 'Lainnya',
    icon: 'Package',
    emoji: '📦',
    keywords: ['lainnya', 'misc', 'dll', 'insidental'],
    defaultType: 'tunai',
    color: '#78716C',
    bgLight: '#F3EFEA',
  },
];

export const CATEGORY_MAP = new Map<string, CategoryItem>(
  CATEGORIES.map(cat => [cat.name.toLowerCase(), cat])
);

export function getCategoryByName(name: string): CategoryItem | undefined {
  return CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase()) || CATEGORIES[8]; // default Lainnya
}
