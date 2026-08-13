import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Users, Ship, Fish, UsersRound, Building2, MapPin, BarChart3, Settings, HelpCircle,
} from 'lucide-react';

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { labelKey: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'nav.nelayan', href: '/nelayan', icon: Users },
  { labelKey: 'nav.kapal', href: '/kapal', icon: Ship },
  { labelKey: 'nav.hasilTangkap', href: '/hasil-tangkap', icon: Fish },
  { labelKey: 'nav.koperasi', href: '/koperasi', icon: UsersRound },
  { labelKey: 'nav.pasarIndustri', href: '/pasar-industri', icon: Building2 },
  { labelKey: 'nav.petaTracking', href: '/peta-tracking', icon: MapPin },
  { labelKey: 'nav.laporan', href: '/laporan', icon: BarChart3 },
  { labelKey: 'nav.pengaturan', href: '/pengaturan', icon: Settings },
  { labelKey: 'nav.bantuan', href: '/bantuan', icon: HelpCircle },
];
