import {
  catchError,
  fromEvent,
  map,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { ThemeHeader, ThemeHeaderType } from '../../features/theme/models';
import { Params } from '@angular/router';

//是否為空值
export const isBlank = (s: any): boolean =>
  s === undefined || s === null || s.trim === undefined || s.trim() === '';
//是否為不為空值
export const isNotBlank = (s: any): boolean => !isBlank(s);

export const isNull = (s: any): boolean => s === undefined || s === null;
export const isNotNull = (s: any): boolean => !isNull(s);

//陣列是否有重複值
export const isDuplicate = (arr: any[]): boolean =>
  arr.length !== arr.filter((e, i, arr2) => arr2.indexOf(e) === i).length;

export const getHeaderId = (
  name: string,
  version: string,
  type: ThemeHeaderType
) => 'ThemeHeader:' + name + ',' + version + ',' + type;
export const parseHeaderId = (
  headerId: string
): { name: string; version: string; type: ThemeHeaderType } | null => {
  const prefix = 'ThemeHeader:';

  if (!headerId.startsWith(prefix)) {
    return null;
  }

  const [name, version, type] = headerId.slice(prefix.length).split(',');
  if (isNotBlank(name) && isNotBlank(version) && isNotBlank(type)) {
    return { name, version, type: type as ThemeHeaderType };
  }
  return null;
};

/**
 * 給陣列使用來進行排序 => [].sort(dynamicSort(key,flag))
 * @param key 排序用的key
 * @param ascending 是否由小至大排列
 * @returns
 */
export function dynamicSort(key: string, ascending: boolean) {
  let sortOrder = ascending ? 1 : -1;
  return (a1: any, a2: any) => {
    if (isBlank(key)) {
      return 1;
    }
    let f: string | number = a1[key];
    let b: string | number = a2[key];
    f = f ?? '';
    b = b ?? '';

    if (typeof f === 'string' && typeof b === 'string') {
      // 如果兩個值都是數字字符串，轉換為數字進行排序
      if (isNumber(f) && isNumber(b)) {
        f = parseFloat(f);
        b = parseFloat(b);
      } else {
        f = f.toLowerCase();
        b = b.toLowerCase();
      }
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
export const replaceValue = (
  value: string,
  obj: any,
  encodedParam?: boolean
): string =>
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
      if (result === undefined) {
        return match;
      }
      return encodedParam ? encodeURIComponent(result) : result; // 如果找到值就替換，否則保留原樣
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

export const isNumber = (value: any) =>
  !isNaN(value) && !isNaN(parseFloat(value));

export const downloadJsonFile = (jsonData: string, fileName: string) => {
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const readJsonFile = (reader: FileReader): Observable<Object> => {
  return fromEvent(reader, 'load').pipe(
    map(() => JSON.parse(reader.result as string)),
    take(1),
    catchError(error => {
      console.error(error.message);
      return throwError(() => error);
    })
  );
};

export const sortSeq = (a: any, b: any): number =>
  parseInt(a.seq) > parseInt(b.seq) ? 1 : -1;

export const getQueryParamsByHeader = (header: ThemeHeader): Params | null => {
  if (header.type === ThemeHeaderType.imageList) {
    const sortArray = header.themeLabelList.filter(x => x.isSort);
    const defaultDataset = header.themeDatasetList.find(x => x.isDefault);
    return {
      page: 1,
      searchValue: '',
      dataset: defaultDataset ? defaultDataset.seq : 1, //
      tag: -1,
      sort: sortArray.length > 0 ? sortArray[0].byKey : '', //
      asc: true,
    };
  }
  return null;
};

export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (map, item) => {
      const key = keyFn(item);
      if (!map[key]) {
        map[key] = [] as T[];
      }
      map[key].push(item);
      return map;
    },
    {} as Record<K, T[]>
  );
}
