/** 接受一般十進位與科學記號，避免空字串或其他進位被誤轉成數字。 */
export function parseGroupDatasetNumber(value: unknown): number | undefined {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text))
    return undefined;
  const number = Number(text);
  return Number.isFinite(number) ? number : undefined;
}
