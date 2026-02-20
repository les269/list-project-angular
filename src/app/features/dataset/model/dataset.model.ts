export interface Dataset {
  name: string;
  config: DatasetConfig;
  createdTime?: Date;
  updatedTime?: Date;
}

export interface DatasetConfig {
  type: DatasetConfigType;
  groupName: string;
  filePath: string;
  fileExtension: string;
  folderPath: string;
  filing: boolean;
  filingRegular: string;
  fieldList: DatasetField[];
  autoImageDownload: boolean;
  imageByKey: string;
  scrapyText: string;
  scrapyPagination: string;
}

export interface DatasetField {
  seq: number;
  type: DatasetFieldType;
  key: string;
  label: string;
  fixedString: string;
  replaceRegular: string;
  replaceRegularTo: string;
}

export enum DatasetFieldType {
  path = 'path',
  fileName = 'fileName',
  fixedString = 'fixedString',
  fileSize = 'fileSize',
}

export interface DatasetData {
  datasetName: string;
  data: any[];
  createdTime?: Date;
  updatedTime?: Date;
}

export enum DatasetConfigType {
  file = 'file',
  folder = 'folder',
  all = 'all',
  text = 'text',
  pagination = 'pagination',
}
export enum QuickRefreshType {
  params = 'params',
  url = 'url',
}
export interface DatasetQuickRefreshTO {
  byKey: string;
  primeKey: string;
  scrapyName: string;
  datasetName: string;
  url: string;
  params: string[];
  quickRefreshType: QuickRefreshType;
}
