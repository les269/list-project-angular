import { ValuePipeline } from './value-pipeline.model';

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
  //CSV = 'CSV',
  //EXCEL = 'EXCEL',
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
