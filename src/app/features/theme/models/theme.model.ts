export interface ThemeHeader {
  name: string;
  version: string;
  title: string;
  type: ThemeHeaderType;
  themeImage: ThemeImage;
  themeLabelList: ThemeLabel[];
  themeDBList: ThemeDB[];
  themeCustomList: ThemeCustom[];
}

export interface ThemeHeaderCopy {
  name: string;
  version: string;
  title: string;
  type: ThemeHeaderType;
}

export enum ThemeHeaderType {
  imageList = 'imageList',
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
  type: ThemeCustomType;
  byKey: string; //對應客製化數值的key
  label: string; //顯示的按鈕名稱
  seq: number; //顯示順序
  apiName: string;
  //用於windows.open
  openUrl: string;
  openUrlByKey: string;
  //複製對應data的資料
  copyValue: string;
  copyValueByKey: string;
  //按鈕使用的icon false為填滿 true填滿
  buttonIconFill: string;
  buttonIconFillColor: string;
  //按鈕false跟true的圖案
  buttonIconTrue: string;
  buttonIconFalse: string;
  apiArray: string;
}

export enum ThemeCustomType {
  openUrl = 'openUrl',
  openUrlByKey = 'openUrlByKey',
  writeNote = 'writeNote',
  copyValue = 'copyValue',
  copyValueByKey = 'copyValueByKey',
  buttonIconBoolean = 'buttonIconBoolean',
  buttonIconFill = 'buttonIconFill',
  buttonInputUrl = 'buttonInputUrl',
  apiArray = 'apiArray',
}

export interface CopyThemeData {
  themeHeader: ThemeHeader;
}
export interface CopyThemeRequest {
  source: ThemeHeaderCopy;
  target: ThemeHeaderCopy;
}

export interface ThemeCustomValue {
  headerId: string;
  byKey: string;
  correspondDataValue: string;
  customValue: string;
}

export interface ThemeCustomValueResponse {
  [correspondDataValue: string]: { [byKey: string]: string };
}

export interface ThemeCustomValueRequest {
  headerId: string;
  valueList: string[];
}
