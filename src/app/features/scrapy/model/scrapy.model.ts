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
}

export enum ScrapyPageType {
  redirect = 'redirect',
  scrapyData = 'scrapyData',
}

export interface Cookie {
  name: string;
  value: string;
}
export interface CssSelect {
  key: string;
  value: string;
  replaceString: string;
  attr: string;
  convertToArray: boolean;
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
