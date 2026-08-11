// Single source of truth for the local illustrated avatar assets (public/avatars/*.svg),
// shared by the seed generator (scripts/seed-mock-data.ts) and the "Tambah Nelayan" form
// so every nelayan — seeded or manually added — gets a real, gender-matched local avatar
// instead of falling back to a generic/blank placeholder. Only differentiated by gender
// (one avatar for pria, one for wanita) — no per-person variation.
export const AVATAR_PRIA = '/avatars/pria.svg';
export const AVATAR_WANITA = '/avatars/wanita.svg';
export const AVATAR_DEFAULT = '/avatars/default.svg';

export type JenisKelamin = 'pria' | 'wanita';

export function avatarForGender(jenisKelamin: JenisKelamin): string {
  return jenisKelamin === 'pria' ? AVATAR_PRIA : AVATAR_WANITA;
}
