function yymm(date: Date): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

function nextSeqForPrefix(existingIds: string[], prefix: string, digits: number): string {
  const seqs = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
  return String(next).padStart(digits, '0');
}

export function nextNelayanId(existingIds: string[], date: Date = new Date()): string {
  const prefix = `NEL-${yymm(date)}-`;
  return `${prefix}${nextSeqForPrefix(existingIds, prefix, 6)}`;
}

export function nextKapalId(existingIds: string[], date: Date = new Date()): string {
  const prefix = `KAP-${yymm(date)}-`;
  return `${prefix}${nextSeqForPrefix(existingIds, prefix, 5)}`;
}

export function nextBiosecurityId(existingIds: string[], date: Date = new Date()): string {
  const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const prefix = `BS-${iso}-`;
  return `${prefix}${nextSeqForPrefix(existingIds, prefix, 3)}`;
}
