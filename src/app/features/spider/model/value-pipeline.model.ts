import { ChipsMapValue } from '../../../core/model';

export enum ValuePipelineType {
  FIXED_VALUE = 'FIXED_VALUE', // 固定值
  FIXED_JSON_VALUE = 'FIXED_JSON_VALUE', // 固定JSON值
  CURRENT_DATA_KEY = 'CURRENT_DATA_KEY', // 當前資料鍵值
  EXTRACT_ATTR = 'EXTRACT_ATTR', // 提取屬性 (原本的 attr)
  EXTRACT_OWN_TEXT = 'EXTRACT_OWN_TEXT', // 僅提取自身文本 (原本的 onlyOwn)
  REPLACE_REGULAR = 'REPLACE_REGULAR', // 正則替換
  SPLIT_TEXT = 'SPLIT_TEXT', // 分割字串
  JOIN_ARRAY_TO_STRING = 'JOIN_ARRAY_TO_STRING', // 將陣列元素合併為字串
  CONVERT_TO_ARRAY = 'CONVERT_TO_ARRAY', // 轉為陣列
  FIRST_VALUE = 'FIRST_VALUE', // 僅保留第一筆資料
  LAST_VALUE = 'LAST_VALUE', // 僅保留最後一筆資料
  COMBINE_TO_STRING = 'COMBINE_TO_STRING', // 合併字串根據當前陣列資料
  COMBINE_BY_KEY = 'COMBINE_BY_KEY', // 合併字串根據當前擁有的鍵值資料
  USE_REPLACE_VALUE_MAP = 'USE_REPLACE_VALUE_MAP', // 使用替換對照表
  MERGE_MULTI_OBJ_TO_ARRAY = 'MERGE_MULTI_OBJ_TO_ARRAY', // 合併多筆物件成陣列
  MERGE_MULTI_ARRAY_TO_ARRAY = 'MERGE_MULTI_ARRAY_TO_ARRAY', // 合併多筆陣列成陣列
  CONVERT_TO_CASE = 'CONVERT_TO_CASE', // 轉為大小寫字串
  CURRENT_TIME = 'CURRENT_TIME', // 取得當前時間
  TIME_FORMAT = 'TIME_FORMAT', // 格式化時間
  CHINESE_CONVERT = 'CHINESE_CONVERT', // 繁簡轉換
  INSERT = 'INSERT', // 插入字串或是陣列元素
  DELETE = 'DELETE', // 刪除字串或是移除陣列元素
  DELETE_PATHS = 'DELETE_PATHS', // 刪除JSON中的特定路徑
  MOVE_CHAR = 'MOVE_CHAR', // 移動字元位置
  CALCULATE = 'CALCULATE', // 計算，根據當前資料進行加減乘除運算
  FETCH_COOKIE = 'FETCH_COOKIE', // 取得cookie資料
  FETCH_HEADER = 'FETCH_HEADER', // 取得header資料
}
export interface ValuePipeline {
  seq: number;
  type: ValuePipelineType;
  enabled: boolean;
  fixedValue: string; // 當 type 是 FIXED_VALUE 時使用
  fixedJsonValue: string; // 當 type 是 FIXED_JSON_VALUE 時使用，會嘗試解析成 JSON 後使用
  currentDataKey: string; // 當 type 是 CURRENT_DATA_KEY 時使用，指定要使用的當前資料鍵值
  attributeName: string; // 當 type 是 EXTRACT_ATTR 時使用
  pattern: string; // 當 type 是 REPLACE_REGULAR 時使用
  replacement: string; // 當 type 是 REPLACE_REGULAR 時使用
  separator: string; // 當 type 是 SPLIT_TEXT 時使用
  joinSeparator: string; // 當 type 是 JOIN_ARRAY_TO_STRING 時使用，指定合併字串的分隔符
  combineToString: string; // 當 type 是 COMBINE_TO_STRING 時使用
  combineByKey: string; // 當 type 是 COMBINE_BY_KEY 時使用
  useReplaceValueMap: string; // 當 type 是 USE_REPLACE_VALUE_MAP 時使用，對應到後端的替換對照表名稱
  mergeMultiObjKeys: string[]; // 當 type 是 MERGE_MULTI_OBJ_TO_ARRAY 時使用，指定用於合併的物件鍵值
  mergeMultiArrayKeys: string[]; // 當 type 是 MERGE_MULTI_ARRAY_TO_ARRAY 時使用，指定用於合併的陣列鍵值
  convertToCaseType: ConvertToCaseType; // 當 type 是 CONVERT_TO_CASE 時使用，指定轉換類型
  currentTimeFormatOption: TimeFormatOption; // 當 type 是 CURRENT_TIME 時使用，指定時間格式
  timeFormat: TimeFormatOption; // 當 type 是 TIME_FORMAT 時使用，指定要格式化的時間字串，預設為當前時間
  chineseConvert: ChineseConvert; // 當 type 是 CHINESE_CONVERT 時使用，指定轉換類型
  insertConfig: InsertConfig; // 當 type 是 INSERT 時使用，指定要插入的字串或陣列元素
  deleteConfig: DeleteConfig; // 當 type 是 DELETE_TEXT 時使用，指定要刪除的字串
  deletePaths: string[]; // 當 type 是 DELETE_PATHS 時使用，指定要刪除的JSON路徑列表
  moveCharConfig: MoveCharConfig; // 當 type 是 MOVE_CHAR 時使用，指定要移動的字元位置
  calculateConfig: CalculateConfig; // 當 type 是 CALCULATE 時使用，指定計算配置
}

export interface TimeFormatOption {
  format: string;
  timezones: Timezones;
  skipTimezoneConversion: boolean; // 是否跳過時區轉換，直接使用當前時間的字串進行格式化
  formatParsed: string; // 解析當前時間格式未符合會無法轉換，提供給使用者參考當前時間格式是否正確
}

export interface InsertConfig {
  position: PositionType; // 插入位置，開始或結束
  index: number; // 當 position 是 NTH 時，指定插入位置的索引（從0開始）
  text: string; // 要插入的字串
}

export interface DeleteConfig {
  position: PositionType; // 刪除位置，開始或結束
  index: number; // 當 position 是 NTH 時，指定刪除位置的索引（從0开始）
  length: number; // 要刪除的字串長度
}

export interface MoveCharConfig {
  fromIndex: number; // 要移動的字元原始位置索引（從0開始）
  toIndex: number; // 要移動的字元目標位置索引（從0開始）
}

export interface ChineseConvert {
  chineseConvertType: ChineseConvertType;
  zhConverterUtilType: ZhConverterUtilType;
}

export interface CalculateConfig {
  variablePaths: ChipsMapValue[]; // json path 表達式對應的變量映射，例如 { a: '$.price', b: '$.quantity' }
  expression: string; // 計算表達式，SPEL格式，使用 #{variable} 來引用 tempMap 中的變量，例如 #{a} + #{b}
  defaultValue: string; // 當計算失敗時的預設值
}

export enum PositionType {
  START = 'START',
  END = 'END',
  NTH = 'NTH',
}
export enum ConvertToCaseType {
  UPPER = 'UPPER',
  LOWER = 'LOWER',
  FIRST_UPPER = 'FIRST_UPPER',
  FIND_FIRST_UPPER = 'FIND_FIRST_UPPER',
}
export enum ChineseConvertType {
  SIMPLIFIED_TO_TRADITIONAL = 'SIMPLIFIED_TO_TRADITIONAL',
  TRADITIONAL_TO_SIMPLIFIED = 'TRADITIONAL_TO_SIMPLIFIED',
}
export enum ZhConverterUtilType {
  ZH_CONVERTER_UTIL = 'ZH_CONVERTER_UTIL',
  ZH_TW_CONVERTER_UTIL = 'ZH_TW_CONVERTER_UTIL',
  ZH_HK_CONVERTER_UTIL = 'ZH_HK_CONVERTER_UTIL',
  ZH_JP_CONVERTER_UTIL = 'ZH_JP_CONVERTER_UTIL',
}

export enum Timezones {
  GMT_M12 = 'GMT_M12',
  GMT_M11 = 'GMT_M11',
  GMT_M10 = 'GMT_M10',
  GMT_M09 = 'GMT_M09',
  GMT_M08 = 'GMT_M08',
  GMT_M07 = 'GMT_M07',
  GMT_M06 = 'GMT_M06',
  GMT_M05 = 'GMT_M05',
  GMT_M04 = 'GMT_M04',
  GMT_M03 = 'GMT_M03',
  GMT_M02 = 'GMT_M02',
  GMT_M01 = 'GMT_M01',
  GMT_P00 = 'GMT_P00',
  GMT_P01 = 'GMT_P01',
  GMT_P02 = 'GMT_P02',
  GMT_P03 = 'GMT_P03',
  GMT_P04 = 'GMT_P04',
  GMT_P05 = 'GMT_P05',
  GMT_P06 = 'GMT_P06',
  GMT_P07 = 'GMT_P07',
  GMT_P08 = 'GMT_P08',
  GMT_P09 = 'GMT_P09',
  GMT_P10 = 'GMT_P10',
  GMT_P11 = 'GMT_P11',
  GMT_P12 = 'GMT_P12',
}
