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
}

export interface DatasetField {
  seq: number;
  type: DatasetFieldType;
  key: string;
  label: string;
  fixedString: string;
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
}
