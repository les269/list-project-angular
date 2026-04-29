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
  useCookie: boolean;
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
  condition: ExtractionStepCondition;
  conditionKey: string;
  conditionValue: string;
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
export enum ValuePipelineType {
  EXTRACT_ATTR = 'EXTRACT_ATTR', // 提取屬性 (原本的 attr)
  EXTRACT_OWN_TEXT = 'EXTRACT_OWN_TEXT', // 僅提取自身文本 (原本的 onlyOwn)
  REPLACE_REGULAR = 'REPLACE_REGULAR', // 正則替換
  SPLIT_TEXT = 'SPLIT_TEXT', // 分割字串
  CONVERT_TO_ARRAY = 'CONVERT_TO_ARRAY', // 轉為陣列
  FIRST_VALUE = 'FIRST_VALUE', // 僅保留第一筆資料
  COMBINE_TO_STRING = 'COMBINE_TO_STRING', // 合併字串根據當前陣列資料
  COMBINE_BY_KEY = 'COMBINE_BY_KEY', // 合併字串根據當前擁有的鍵值資料
  USE_REPLACE_VALUE_MAP = 'USE_REPLACE_VALUE_MAP', // 使用替換對照表
}
export interface ValuePipeline {
  seq: number;
  type: ValuePipelineType;
  enabled: boolean;
  attributeName?: string; // 當 type 是 EXTRACT_ATTR 時使用
  pattern?: string; // 當 type 是 REPLACE_REGULAR 時使用
  replacement?: string; // 當 type 是 REPLACE_REGULAR 時使用
  separator?: string; // 當 type 是 SPLIT_TEXT 時使用
  combineToString?: string; // 當 type 是 COMBINE_TO_STRING 時使用
  combineByKey?: string; // 當 type 是 COMBINE_BY_KEY 時使用
  useReplaceValueMap?: string; // 當 type 是 USE_REPLACE_VALUE_MAP 時使用，對應到後端的替換對照表名稱
}
