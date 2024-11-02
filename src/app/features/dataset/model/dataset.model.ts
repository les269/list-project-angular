export interface Dataset {
  name: string;
  config: DatasetConfig;
  createdTime?: Date;
  updatedTime?: Date;
}

export interface DatasetConfig {
  type: DatasetConfigType;
  groupName: string;
  byKey: string;
  filePath: string;
  fileExtension: string;
  folderPath: string;
  filing: boolean;
  filingRegular: string;
  fieldList: DatasetField[];
  autoImageDownload: boolean;
  imageByKey: string;
  imageSaveFolder: string;
  datasetScrapyList: DatasetScrapy[];
}

export interface DatasetField {
  seq: number;
  type: DatasetFieldType;
  key: string;
  label: string;
}

export enum DatasetFieldType {
  string = 'string',
  stringArray = 'stringArray',
  number = 'number',
  date = 'date',
}

export interface DatasetGroup {
  groupName: string;
  primeValue: string;
  json: any;
  createdTime?: Date;
  updatedTime?: Date;
}

export interface DatasetData {
  datasetConfigName: string;
  data: any[];
  createdTime?: Date;
  updatedTime?: Date;
}

export enum DatasetConfigType {
  file = 'file',
  folder = 'folder',
  all = 'all',
}

export interface DatasetScrapy {
  seq: number;
  name: string;
  label: string;
  isDefault: boolean;
  visibleJson: boolean;
  visibleUrl: boolean;
}
