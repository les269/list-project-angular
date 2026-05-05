export enum HeadersMode {
  create = 'create',
  edit = 'edit',
}

export interface Headers {
  seq: number;
  name: string;
  value: string;
}

export interface HeadersTO {
  headersId: string;
  list: Headers[];
  description?: string;
  updatedTime?: Date;
}

export enum HeadersMapType {
  SPIDER = 'SPIDER',
  API = 'API',
}

export interface HeadersMapTO {
  refId: string;
  type: HeadersMapType;
  headersId: string;
  updatedTime?: Date;
}
