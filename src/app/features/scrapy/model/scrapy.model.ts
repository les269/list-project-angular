export interface ScrapyConfig {
  name: string;
  paramSize: number;
  data: ScrapyData[];
  createdTime?: Date;
  updatedTime?: Date;
  testJson: string;
  testUrl: string;
}

export interface ScrapyData {
  name: string;
  url: string;
  cookie: Cookie[];
  scrapyPageType: ScrapyPageType;
  cssSelectList: CssSelect[];
  script: string;
  html: string;
  replaceRegular: string;
  replaceRegularTo: string;
}

export enum ScrapyPageType {
  redirect = 'redirect',
  scrapyData = 'scrapyData',
}

export interface Cookie {
  seq: number;
  name: string;
  value: string;
}
export interface CssSelect {
  seq: number;
  key: string;
  value: string;
  replaceString: string;
  attr: string;
  convertToArray: boolean;
  onlyOwn: boolean;
  replaceRegular: string;
  replaceRegularTo: string;
  replaceValueMapName: string;
  splitText: string;
}

export interface HtmlRequest {
  url: string;
  cookies: Cookie[];
}

export interface ScrapyTestReq {
  scrapyData?: ScrapyData;
  scrapyDataList?: ScrapyData[];
  json?: string[];
  url?: string;
}

export interface ScrapyReq {
  scrapyName: string;
  json?: string[];
  url?: string;
}

export interface ScrapyPagination {
  name: string;
  config: ScrapyPaginationConfig;
  createdTime?: Date;
  updatedTime?: Date;
}
export interface ScrapyPaginationConfig {
  startUrl: string;
  lastUpdateDate: Date;
  currentUpdateDate?: Date;
  updateInterval: number;
  updateIntervalType: UpdateIntervalType;
  keyRedirectUrlMap: { [key: string]: string };
  // redirectParamsList: string[][];
  cookie: Cookie[];
  cssSelectList: CssSelect[];
  springExpressionLangList: SpringExpressionLang[];
}

export enum UpdateIntervalType {
  year = 'year',
  month = 'month',
  day = 'day',
}

export interface SpringExpressionLang {
  seq: number;
  key: string;
  expression: string;
}

export interface ScrapyPaginationTest {
  html: string;
  config: ScrapyPaginationConfig;
}
