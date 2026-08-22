export function parsePositivePage(value: string | null): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}
