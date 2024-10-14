export interface ApiConfig {
  apiName: string;
  apiLabel: string;
  httpMethod: HttpMethodType;
  endpointUrl: string;
  requestBody: string;
  httpParams: string;
  httpHeaders: string;
  successMessage: string;
  updatedTime?: number;
}
export interface ApiConfigPK {
  apiName: string;
  apiLabel: string;
}
export enum HttpMethodType {
  get = 'get',
  post = 'post',
  delete = 'delete',
  put = 'put',
}
