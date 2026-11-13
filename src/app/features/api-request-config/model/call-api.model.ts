/** 執行畫面的參數，交由後端解析 JSONPath 與替換請求內容。 */
export type CallApiParameters = Record<string, unknown>;

export interface CallApiRequest {
  apiId: string;
  json: CallApiParameters;
}

export type CallApiResponse = Record<string, unknown>[];

/** 執行畫面使用的顯示資料，不代表後端的傳輸格式。 */
export interface CallApiResult {
  status: number;
  headers: string;
  body: string;
  bodyLanguage: 'json' | '';
}
