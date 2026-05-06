import { ValuePipeline } from './value-pipeline';

export interface SpiderConfig {
  spiderId: string; //pk
  description: string;
  primeKeySize: number;
  testData: SpiderConfigTestData; //測試區使用的資料
  isUrlBased: boolean; //僅只有URL的爬蟲，沒有使用primeKey爬蟲
  updatedTime?: Date;
}

export interface SpiderConfigTestData {
  primeKeyList: string[];
  url: string;
  resultJson: string;
}

export interface SpiderReq {
  spiderId: string;
  url?: string;
  primeKeyList?: string[];
}

export interface SpiderTestReq {
  spiderConfig: SpiderConfig;
  spiderItems: SpiderItem[];
}
export interface SpiderMapping {
  spiderId: string; //pk
  executionOrder: number; //pk 代表執行順序
  spiderItemId: string;
  updatedTime?: Date;
}

export interface SpiderItem {
  spiderItemId: string; //pk
  description: string;
  itemSetting: SpiderItemSetting;
  updatedTime?: Date;
}

export interface SpiderItemSetting {
  url: string;
  urlType: UrlType;
  testData: SpiderItemSettingTestData;
  mode: ExtractionRuleMode; //select 多筆陣列 selectFirst 單一值 jsonPath 使用jsonPath語法
  extractionRuleList: ExtractionRule[];
  skipWhenUsingUrl: boolean;
}

export interface SpiderItemSettingTestData {
  html: string; // jsoup用的測試區使用的html
  json: string; // jsonPath用的測試區使用的json
  resultJson: string;
}

export enum SpiderItemMode {
  create = 'create',
  edit = 'edit',
}

export enum UrlType {
  BY_PARAMS = 'BY_PARAMS',
  BY_PRIME_KEY = 'BY_PRIME_KEY',
}

export interface ExtractionRule {
  seq: number;
  key: string; // 最終結果的 key path
  selector: string; // jsoup selector
  jsonPath: string; // 用於 jsonPath 的路徑
  pipelines: ValuePipeline[];
  conditionValue: ExtractionCondition;
}

export interface ExtractionCondition {
  conditionType: ExtractionStepCondition; // 執行條件類型
  key: string;
  value: string;
  ignoreCase: boolean;
}

export enum ExtractionRuleMode {
  SELECT = 'SELECT',
  JSON_PATH = 'JSON_PATH',
}

export enum ExtractionStepCondition {
  ALWAYS = 'ALWAYS', // 總是執行 (預設)
  IF_KEY_EMPTY = 'IF_KEY_EMPTY', // 當 result 中某個 Key 為空時才執行
  IF_KEY_NOT_EMPTY = 'IF_KEY_NOT_EMPTY', // 當 result 中某個 Key 不為空時才執行
  CONTAINS = 'CONTAINS', // 當 result 中某個 Key 包含特定值時才執行(陣列包含或字串包含)
  NOT_CONTAINS = 'NOT_CONTAINS', // 當 result 中某個 Key 不包含特定值時才執行(陣列不包含或字串不包含)
  EQUALS = 'EQUALS', // 當 result 中某個 Key 等於特定值時才執行
  NOT_EQUALS = 'NOT_EQUALS', // 當 result 中某個 Key 不等於特定值時才執行
  MATCHES = 'MATCHES', // 當 result 中某個 Key 符合正則時才執行
  NOT_MATCHES = 'NOT_MATCHES', // 當 result 中某個 Key 不符合正則時才執行
}
