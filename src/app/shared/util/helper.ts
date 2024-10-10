import { ThemeHeader } from '../../features/theme/models';

export const isBlank = (s: any): boolean =>
  s === undefined || s === null || s.trim() === '';
export const isNotBlank = (s: any): boolean => !isBlank(s);

export const isRepeat = (arr: any[]): boolean =>
  arr.length !== arr.filter((e, i, arr2) => arr2.indexOf(e) === i).length;

export const getHeaderId = ({ name, version, type }: ThemeHeader) =>
  'ThemeHeader:' + name + ',' + version + ',' + type;

export function dynamicSort(key: string, ascending: boolean) {
  let sortOrder = ascending ? 1 : -1;
  return (a1: any, a2: any) => {
    if (key === null || key === '') {
      return 1;
    }
    let f: string | number = a1[key];
    let b: string | number = a2[key];

    if (typeof f === 'string' && typeof b === 'string') {
      f = f.toLowerCase();
      b = b.toLowerCase();
    }
    const result = f < b ? -1 : f > b ? 1 : 0;
    return result * sortOrder;
  };
}

export function getRandomInt(min: number, max: number) {
  const randomBuffer = new Uint32Array(1);

  window.crypto.getRandomValues(randomBuffer);

  let randomNumber = randomBuffer[0] / (0xffffffff + 1);

  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(randomNumber * (max - min + 1)) + min;
}
