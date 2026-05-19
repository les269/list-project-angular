import { ValuePipeline } from './value-pipeline.model';

export enum HeadersMode {
  create = 'create',
  edit = 'edit',
}

export interface Header {
  seq: number;
  name: string;
  value: string;
  valuePipelines: ValuePipeline[];
}

export interface HeadersTO {
  headersId: string;
  list: Header[];
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
