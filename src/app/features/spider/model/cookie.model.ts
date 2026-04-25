export enum CookieMode {
  create = 'create',
  edit = 'edit',
}

export interface Cookie {
  seq: number;
  name: string;
  value: string;
}

export interface CookieListTO {
  cookieId: string;
  list: Cookie[];
  description?: string;
  updatedTime?: Date;
}

export enum CookieListMapType {
  SPIDER = 'SPIDER',
  API = 'API',
}

export interface CookieListMapTO {
  refId: string;
  type: CookieListMapType;
  cookieId: string;
  updatedTime?: Date;
}
