import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Users, Ship, Fish, UsersRound, Building2, MapPin, BarChart3, Settings, HelpCircle,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Nelayan', href: '/nelayan', icon: Users },
  { label: 'Kapal', href: '/kapal', icon: Ship },
  { label: 'Hasil Tangkap', href: '/hasil-tangkap', icon: Fish },
  { label: 'Koperasi', href: '/koperasi', icon: UsersRound },
  { label: 'Pasar / Industri', href: '/pasar-industri', icon: Building2 },
  { label: 'Peta Tracking', href: '/peta-tracking', icon: MapPin },
  { label: 'Laporan & Analitik', href: '/laporan', icon: BarChart3 },
  { label: 'Pengaturan', href: '/pengaturan', icon: Settings },
  { label: 'Bantuan', href: '/bantuan', icon: HelpCircle },
];
