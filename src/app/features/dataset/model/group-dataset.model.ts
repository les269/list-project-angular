export interface GroupDataset {
  groupName: string;
  config: GroupDatasetConfig;
  createdTime?: Date;
  updatedTime?: Date;
}
export interface GroupDatasetConfig {
  byKey: string;
  type: GroupDatasetConfigType;
  imageSaveFolder: string;
  autoImageDownload: boolean;
  imageByKey: string;
  groupDatasetSpiderList: GroupDatasetSpider[];
  groupDatasetFieldList: GroupDatasetField[];
  groupDatasetApiList: GroupDatasetApi[];
}

export interface GroupDatasetSpider {
  seq: number;
  spiderId: string;
  label: string;
  isDefault: boolean;
  visibleJson: boolean;
  visibleUrl: boolean;
}

export interface GroupDatasetField {
  seq: number;
  type: GroupDatasetFieldType;
  key: string;
  label: string;
  required: boolean;
}

export interface GroupDatasetData {
  groupName: string;
  primeValue: string;
  json: any;
  createdTime?: Date;
  updatedTime?: Date;
}
export enum GroupDatasetFieldType {
  string = 'string',
  stringArray = 'stringArray',
  number = 'number',
  date = 'date',
  jsonObject = 'jsonObject',
  jsonArray = 'jsonArray',
}
export interface GroupDatasetApi {
  seq: number;
  apiId: string;
  label: string;
}

export enum GroupDatasetConfigType {
  spider = 'spider',
  api = 'api',
}
