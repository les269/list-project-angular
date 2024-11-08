import { ApiConfig } from '../../api-config/model';

export interface ThemeHeader {
  name: string;
  version: string;
  title: string;
  type: ThemeHeaderType;
  themeImage: ThemeImage;
  themeLabelList: ThemeLabel[];
  themeDatasetList: ThemeDataset[];
  themeCustomList: ThemeCustom[];
  themeTagList: ThemeTag[];
  seq: number;
  themeOtherSetting: ThemeOtherSetting;
}

export interface ThemeOtherSetting {
  rowColor: string[];
  listPageSize: number;
  topCustomList: ThemeCustom[];
}
export interface ThemeHeaderCopy {
  name: string;
  version: string;
  title: string;
  type: ThemeHeaderType;
  seq: number;
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
  dateFormat: string;
  width: string;
  maxWidth: string;
  minWidth: string;
}

export enum ThemeLabelType {
  string = 'string',
  stringSplit = 'stringSplit',
  seq = 'seq',
  fileSize = 'fileSize',
  stringArray = 'stringArray',
  date = 'date',
}

export interface ThemeDataset {
  seq: number;
  datasetList: string[];
  label: string;
  isDefault: boolean;
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
  apiConfig?: ApiConfig;
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
  apiConfig = 'apiConfig',
}

export interface ThemeTopCustom {
  type: ThemeTopCustomType;
  label: string; //顯示的按鈕名稱
  byKey: string;
  seq: number; //顯示順序
  openUrl: string;
  apiName: string;
  apiConfig?: ApiConfig;
}

export enum ThemeTopCustomType {
  openUrl = 'openUrl',
  writeNote = 'writeNote',
  buttonInputUrl = 'buttonInputUrl',
  apiConfig = 'apiConfig',
  repeatData = 'repeatData',
  inputApi = 'inputApi',
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

export interface SortType {
  key: string;
  label: string;
}

export interface ThemeTag {
  seq: number;
  tag: string;
}

export interface ThemeTagValue {
  headerId: string;
  tag: string;
  valueList: string[];
}

export enum UpdateTagValue {
  add = 'add',
  remove = 'remove',
}
export interface ThemeTagValueReq {
  type: UpdateTagValue;
  headerId: string;
  tag: string;
  value: string;
}

export const DEFAULT_ROW_COLOR: string[] = [
  '#e6c3c3e5',
  '#e6e5c3e5',
  '#cde6c3e5',
  '#c3e6d9e5',
  '#bceff3e5',
  '#bdbcf3e5',
  '#e2bcf3e5',
];
