export interface ThemeRequest {
  themeHeader: ThemeHeader;
  themeImage: ThemeImage;
  themeLabelList: ThemeLabel[];
  themeDBList: ThemeDB[];
  themeCustom: ThemeCustom[];
}

export interface ThemeResponent {
  themeHeader: ThemeHeader;
  themeImage: ThemeImage;
  themeLabelList: ThemeLabel[];
  themeDBList: ThemeDB[];
  themeCustom: ThemeCustom[];
}

export interface ThemeHeader {
  name: string;
  version: string;
  title: string;
  type: ThemeHeaderType;
}

export enum ThemeHeaderType {
  imageList = 'imageList',
  list = 'list',
  table = 'table',
}

export interface ThemeImage {
  type: ThemeImageType;
  imageKey: string;
  imageUrl: string;
}

export enum ThemeImageType {
  key = 'key',
  url = 'url',
}

export interface ThemeLabel {
  seq: number;
  byKey: string;
  label: string;
  type: ThemeLabelType;
  splitBy: string;
  useSpace: string;
  isSearchButton: boolean;
  isSearchValue: boolean;
  isCopy: boolean;
  isVisible: boolean;
  isSort: boolean;
  isDefaultKey: boolean;
}

export enum ThemeLabelType {
  string = 'string',
  stringSplit = 'stringSplit',
  seq = 'seq',
  fileSize = 'fileSize',
  //TODO:是否有需求
  //dateFormat = 'dateFormat',
}

export interface ThemeDB {
  seq: number;
  type: ThemeDBType;
  source: string;
  label: string;
  groups: string;
  isDefault: boolean;
}

export enum ThemeDBType {
  json = 'json',
  group = 'group',
}

export interface ThemeCustom {
  type: string;
  key?: string;
  label?: string;
  api?: string;
  method?: string;
  openUrl?: string;
  openUrlByKey?: string;
  copyValue?: string;
  copyValueByKey?: string;
  buttonIconBefore?: string;
  buttonIconAfter?: string;
  completedMsg?: string;
  note?: string;
}

export enum ThemeCustomType {}

export interface CopyThemeData {
  themeHeader: ThemeHeader;
}
export interface CopyThemeRequest {
  source: ThemeHeader;
  target: ThemeHeader;
}
