export interface GroupDataset {
  groupName: string;
  config: GroupDatasetConfig;
  createdTime?: Date;
  updatedTime?: Date;
}
export interface GroupDatasetConfig {
  byKey: string;
  groupDatasetScrapyList: GroupDatasetScrapy[];
  groupDatasetFieldList: GroupDatasetField[];
}

export interface GroupDatasetScrapy {
  seq: number;
  name: string;
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
}
