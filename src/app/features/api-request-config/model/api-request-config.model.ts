import { EditMode } from '../../../core/model/global.model';
export interface ApiRequestConfig {
  apiId: string;
  description: string;
  config: ApiRequestSettings;
  createdTime?: Date;
  updatedTime?: Date;
}

export interface ApiRequestQueryParam {
  seq: number;
  name: string;
  value: string;
  enabled: boolean;
}

export const createApiRequestQueryParam = (
  data: Partial<ApiRequestQueryParam> = {}
) => ({
  seq: 0,
  name: '',
  value: '',
  enabled: true,
  ...data,
}) satisfies ApiRequestQueryParam;

export interface ApiRequestSettings {
  httpMethod: HttpMethodType;
  endpointUrl: string;
  requestBody: string;
  httpParams: ApiRequestQueryParam[];
  bodyType: ApiRequestBodyType;
  bodyFormFields: ApiRequestQueryParam[];
  timeoutMs: number;
  enabled: boolean;
  successMessage: string;
}

export enum HttpMethodType {
  get = 'get',
  post = 'post',
  delete = 'delete',
  put = 'put',
}

export enum ApiRequestBodyType {
  none = 'none',
  formData = 'form-data',
  formUrlEncoded = 'x-www-form-urlencoded',
  text = 'text',
  javascript = 'javascript',
  json = 'json',
  html = 'html',
  xml = 'xml',
}

export interface ApiRequestConfigDialogData {
  value: ApiRequestConfig;
  type: EditMode;
}

export const createApiRequestSettings = (
  settings: Partial<ApiRequestSettings> = {}
): ApiRequestSettings => ({
  ...structuredClone(settings),
  httpMethod: settings.httpMethod ?? HttpMethodType.get,
  endpointUrl: settings.endpointUrl ?? '',
  requestBody: settings.requestBody ?? '',
  httpParams: structuredClone(settings.httpParams ?? []),
  bodyType:
    settings.bodyType ??
    (settings.requestBody ? ApiRequestBodyType.json : ApiRequestBodyType.none),
  bodyFormFields: structuredClone(settings.bodyFormFields ?? []),
  timeoutMs: settings.timeoutMs ?? 10000,
  enabled: settings.enabled ?? true,
  successMessage: settings.successMessage ?? '',
});

export const getApiRequestLabel = (item: ApiRequestConfig): string =>
  item.description ? `${item.apiId} — ${item.description}` : item.apiId;
