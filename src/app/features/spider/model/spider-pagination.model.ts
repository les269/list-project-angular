import { ExtractionRule, ExtractionRuleMode } from './extraction.model';

export interface SpiderPagination {
  spiderPaginationId: string;
  paginationConfig: SpiderPaginationConfig;
  createdTime?: Date;
  updatedTime?: Date;
}

export interface SpiderPaginationData {
  spiderPaginationId: string;
  groupId: string; // 分組識別碼，例如 anime-2026
  dataId: string; // 從擷取結果取得的單筆資料識別碼
  data: Record<string, any>;
  createdTime?: Date;
  updatedTime?: Date;
  lastSuccessTime?: Date;
}

export interface SpiderPaginationConfig {
  groupIdTemplate: string; // 分組識別碼範本，例如 anime-{{$.year}}
  dataIdKey: string; // 從每筆擷取結果讀取資料識別碼的 key
  paramSettings: ParamSetting[];
  startUrl: string;
  nextPageUrlKey: string; // 當資料為空時即終止
  extractionRuleMode: ExtractionRuleMode;
  extractionRuleList: ExtractionRule[];
  updateControl: UpdateControl;
  requestIntervalMs: number; // 上一筆請求完成後的等待時間
}

export interface ParamSetting {
  seq: number;
  paramKey: string; // 置換的標記，如 {code}, {time}
  type: ParamType; // STATIC_LIST, NUMBER_RANGE, TIME_RANGE

  // --- 1. 固定字串列表 ---
  staticList: string[];

  // --- 2. 數字 (全字串化，支援間隔與補零) ---
  startNumStr: string; // 例如 "001" 或 "0"
  endNumStr: string; // 例如 "999" 或 "100"
  numStep: number; // 步長間隔，例如 1 或 10
  padZeros: boolean; // 是否保持與 startNumStr 同樣的長度補零

  // --- 3. 時間推進 (自由定義起點、終點與間隔單位) ---
  startTime: Date;
  timeFormat: string; // 時間格式，例如 "yyyy-MM-dd HH:mm:ss"
  timeInterval: number; // 間隔數量，例如 1、2、7
  timeIntervalUnit: TimeUnit; // YEAR, WEEK, DAY, HOUR, MINUTE, SECOND
  endTimeConfig: EndTimeConfig; // 終止時間設定
}

export interface UpdateControl {
  lastUpdateMode: LastUpdateMode; // 使用最後更新時間或建立時間
  lastUpdateDate: Date; // 當 lastUpdateMode == 'FIXED' 時使用
  lastUpdateParamKey: string; // 當 lastUpdateMode == 'USE_PARAM' 時使用，對應 ParamSetting.paramKey
  updateIntervalMode: UpdateIntervalMode; // 使用固定間隔或使用參數設定
  updateInterval: number; // 當 updateIntervalMode == 'FIXED' 時使用
  updateIntervalUnit: TimeUnit; // 當 updateIntervalMode == 'FIXED' 時使用
  updateIntervalParamKey: string; // 當 updateIntervalMode == 'USE_PARAM' 時使用，對應 ParamSetting.paramKey
}

export enum LastUpdateMode {
  NONE = 'NONE',
  FIXED = 'FIXED',
  USE_PARAM = 'USE_PARAM',
}

export enum UpdateIntervalMode {
  NONE = 'NONE',
  FIXED = 'FIXED',
  USE_PARAM = 'USE_PARAM',
}

export interface EndTimeConfig {
  endTimeType: EndTimeType; // FIXED, CURRENT_DATE, END_CURRENT_YEAR, RELATIVE_OFFSET
  timeFormat: string;

  // 當 endTimeType == FIXED 時使用
  endTime: Date;

  // 當 endTimeType == RELATIVE_OFFSET 時使用
  offsetInterval: number; // 可以是負數或正數，例如 -7
  offsetUnit: TimeUnit; // DAY, WEEK, MONTH...
}

export enum ParamType {
  STATIC_LIST = 'STATIC_LIST',
  NUMBER_RANGE = 'NUMBER_RANGE',
  TIME_RANGE = 'TIME_RANGE',
}

export enum TimeUnit {
  YEAR = 'YEAR',
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  DAY = 'DAY',
  HOUR = 'HOUR',
  MINUTE = 'MINUTE',
  SECOND = 'SECOND',
  MILLI_SECOND = 'MILLI_SECOND',
}

export enum EndTimeType {
  FIXED = 'FIXED', // 固定時間
  CURRENT_DATE = 'CURRENT_DATE', // 執行當天的此刻
  END_CURRENT_YEAR = 'END_CURRENT_YEAR', // 當年的最後一刻
  RELATIVE_OFFSET = 'RELATIVE_OFFSET', // 相對偏移
}
