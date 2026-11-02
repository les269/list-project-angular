import { ExtractionRule, ExtractionRuleMode } from './extraction.model';

export interface SpiderConfig {
  spiderId: string; //pk
  description: string;
  primeKeySize: number;
  testData: SpiderConfigTestData; //測試區使用的資料
  isUrlBased: boolean; //僅只有URL的爬蟲，沒有使用primeKey爬蟲
  updatedTime?: Date;
  requestIntervalMs?: number; // TODO上一筆請求完成後的等待時間
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
