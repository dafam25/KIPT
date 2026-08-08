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

function localDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function nextBiosecurityId(existingIds: string[], date: Date = new Date()): string {
  const prefix = `BS-${localDateString(date)}-`;
  return `${prefix}${nextSeqForPrefix(existingIds, prefix, 3)}`;
}
