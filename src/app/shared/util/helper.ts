import { ThemeHeader } from '../../features/theme/models';

//是否為空值
export const isBlank = (s: any): boolean =>
  s === undefined || s === null || s.trim() === '';
//是否為不為空值
export const isNotBlank = (s: any): boolean => !isBlank(s);

export const isNull = (s: any): boolean => s === undefined || s === null;
export const isNotNull = (s: any): boolean => !isNull(s);

//陣列是否有重複值
export const isRepeat = (arr: any[]): boolean =>
  arr.length !== arr.filter((e, i, arr2) => arr2.indexOf(e) === i).length;

export const getHeaderId = ({ name, version, type }: ThemeHeader) =>
  'ThemeHeader:' + name + ',' + version + ',' + type;
/**
 * 給陣列使用來進行排序 => [].sort(dynamicSort(key,flag))
 * @param key 排序用的key
 * @param ascending 是否由小至大排列
 * @returns
 */
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

// 函數用於生成在指定的最小值(min)和最大值(max)之間的隨機整數（包含邊界）
export function getRandomInt(min: number, max: number) {
  // 創建一個緩衝區來保存一個 32 位的無符號整數
  const randomBuffer = new Uint32Array(1);

  // 使用加密安全的隨機數生成器來填充緩衝區
  window.crypto.getRandomValues(randomBuffer);

  // 將緩衝區中的數值轉換為 0 到 1 之間的浮點數
  let randomNumber = randomBuffer[0] / (0xffffffff + 1);

  // 將最小值向上取整，確保是整數
  min = Math.ceil(min);
  // 將最大值向下取整，確保是整數
  max = Math.floor(max);
  // 返回計算出的隨機整數，範圍在 min 和 max 之間
  return Math.floor(randomNumber * (max - min + 1)) + min;
}

/**
 * 替換${}的字串
 * @param value
 * @param obj
 * @returns
 */
export const replaceValue = (value: string, obj: any): string =>
  value.replace(/\$\{(.*?)\}/g, (match, key) => {
    try {
      // 分割路徑，並使用正則表達式來分辨陣列索引
      const keys = key
        .trim()
        .split(/[\.\[\]]+/)
        .filter(Boolean);
      const result = keys.reduce((acc: any, curr: any) => {
        // 如果是數字字串，將其轉換成數字來訪問陣列
        return acc && acc[isNaN(Number(curr)) ? curr : Number(curr)];
      }, obj);
      return result !== undefined ? result : match; // 如果找到值就替換，否則保留原樣
    } catch (e) {
      return match; // 如果路徑解析失敗，返回原值
    }
  });
export const isJson = (s: string): boolean => {
  if (isBlank(s)) {
    return false;
  }
  try {
    JSON.parse(s);
    return true;
  } catch (e) {
    return false;
  }
};
export const isNotJson = (s: string): boolean => !isJson(s);
export const jsonFormat = (s: string): string =>
  isNotBlank(s) && isJson(s) ? JSON.stringify(JSON.parse(s.trim())) : '';
export const isValidWidth = (value: string) => {
  const regex = /^(auto|0|(\d+(\.\d+)?(px|em|rem|vw|vh|%)?))$/i;
  return regex.test(value);
};
