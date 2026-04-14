export interface SpiderConfig {
  spiderId: string; //pk
  description: string;
  primeKeySize: number;
  testData: { pkArray: string[]; url: string; resultJson: string }; //測試區使用的資料
  isUrlBased: boolean; //僅只有URL的爬蟲，沒有使用primeKey爬蟲
  updatedTime?: Date;
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
  url: string;
  urlType: UrlType;
  testData: { html: string; json: string; resultJson: string };
  redirectUrlKey: string;
  extractionRuleList: ExtractionRule[];
  updatedTime?: Date;
}

export enum UrlType {
  BY_REDIRECT = 'BY_REDIRECT',
  BY_PRIME_KEY = 'BY_PRIME_KEY',
}

export interface ExtractionRule {
  seq: number;
  key: string; // 最終結果的 key path
  mode: ExtractionRuleMode; //select 多筆陣列 selectFirst 單一值 jsonPath 使用jsonPath語法
  selector: string; // jsoup selector
  jsonPath: string; // 用於 jsonPath 的路徑
  pipelines: ValuePipeline[];
  condition: ExtractionStepCondition;
  conditionKey?: string;
}

export enum ExtractionRuleMode {
  SELECT = 'SELECT',
  SELECT_FIRST = 'SELECT_FIRST',
  JSON_PATH = 'JSON_PATH',
  NONE = 'NONE',
}

export enum ExtractionStepCondition {
  ALWAYS = 'ALWAYS', // 總是執行 (預設)
  IF_KEY_EMPTY = 'IF_KEY_EMPTY', // 當 result 字典中某個 Key 為空時才執行
}
export enum ValuePipelineType {
  EXTRACT_ATTR = 'EXTRACT_ATTR', // 提取屬性 (原本的 attr)
  EXTRACT_OWN_TEXT = 'EXTRACT_OWN_TEXT', // 僅提取自身文本 (原本的 onlyOwn)
  REPLACE_REGULAR = 'REPLACE_REGULAR', // 正則替換
  REPLACE_VALUE = 'REPLACE_VALUE', // 模板替換 (原本的 replaceString)
  SPLIT_TEXT = 'SPLIT_TEXT', // 分割字串
  CONVERT_TO_ARRAY = 'CONVERT_TO_ARRAY', // 轉為陣列
  FIRST_VALUE = 'FIRST_VALUE', // 僅保留第一筆資料 (新增)
}
export type ValuePipeline =
  | { type: ValuePipelineType.EXTRACT_ATTR; attributeName: string }
  | {
      type: ValuePipelineType.REPLACE_REGULAR;
      pattern: string;
      replacement: string;
    }
  | { type: ValuePipelineType.SPLIT_TEXT; separator: string }
  | { type: ValuePipelineType.CONVERT_TO_ARRAY }
  | { type: ValuePipelineType.EXTRACT_OWN_TEXT }
  | {
      type: ValuePipelineType.REPLACE_VALUE;
      template: string;
      replaceValueMapName: string;
    }
  | { type: ValuePipelineType.FIRST_VALUE };
