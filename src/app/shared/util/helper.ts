export const isBlank = (s: any): boolean =>
  s === undefined || s === null || s.trim() === '';
export const isNotBlank = (s: any): boolean => !isBlank(s);
