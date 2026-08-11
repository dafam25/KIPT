// Single source of truth for the local illustrated avatar assets (public/avatars/*.svg),
// shared by the seed generator (scripts/seed-mock-data.ts) and the "Tambah Nelayan" form
// so every nelayan — seeded or manually added — gets a real, gender-matched local avatar
// instead of falling back to a generic/blank placeholder.
export const AVATAR_PRIA = [
  '/avatars/pria-01.svg',
  '/avatars/pria-02.svg',
  '/avatars/pria-03.svg',
  '/avatars/pria-04.svg',
  '/avatars/pria-05.svg',
];
export const AVATAR_WANITA = [
  '/avatars/wanita-01.svg',
  '/avatars/wanita-02.svg',
  '/avatars/wanita-03.svg',
  '/avatars/wanita-04.svg',
  '/avatars/wanita-05.svg',
];
export const AVATAR_DEFAULT = '/avatars/default.svg';

export type JenisKelamin = 'pria' | 'wanita';

export function randomAvatar(jenisKelamin: JenisKelamin): string {
  const pool = jenisKelamin === 'pria' ? AVATAR_PRIA : AVATAR_WANITA;
  return pool[Math.floor(Math.random() * pool.length)];
}
