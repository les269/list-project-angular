export interface ApiConfig {
  apiName: string;
  httpMethod: HttpMethodType;
  endpointUrl: string;
  requestBody: string;
  httpParams: string;
  httpHeaders: string;
  successMessage: string;
  updatedTime?: number;
}
export enum HttpMethodType {
  get = 'get',
  post = 'post',
  delete = 'delete',
  put = 'put',
}
