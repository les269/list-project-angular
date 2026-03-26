import {
  ThemeCustom,
  ThemeDataset,
  ThemeImage,
  ThemeLabel,
  ThemeOtherSetting,
  ThemeTag,
  ThemeTopCustom,
} from './theme.model';

export enum ThemeItemType {
  IMAGE = 'IMAGE',
  LABEL = 'LABEL',
  DATASET = 'DATASET',
  CUSTOM = 'CUSTOM',
  TAG = 'TAG',
  OTHERSETTING = 'OTHERSETTING',
  TOPCUSTOM = 'TOPCUSTOM',
}

export enum ThemeTableEditMode {
  NEW = 'new',
  EDIT = 'edit',
}
export interface ThemeItemSummary {
  itemId: string;
  description?: string;
  updatedTime?: Date;
}

export interface ThemeMapTO {
  itemId: string;
  headerId: string;
  type: ThemeItemType;
}

export type ThemeImageItem = ThemeItemSummary & {
  type: ThemeItemType.IMAGE;
  json: ThemeImage;
};

export type ThemeLabelItem = ThemeItemSummary & {
  type: ThemeItemType.LABEL;
  json: ThemeLabel[];
};

export type ThemeDatasetItem = ThemeItemSummary & {
  type: ThemeItemType.DATASET;
  json: ThemeDataset[];
};

export type ThemeCustomItem = ThemeItemSummary & {
  type: ThemeItemType.CUSTOM;
  json: ThemeCustom[];
};

export type ThemeTagItem = ThemeItemSummary & {
  type: ThemeItemType.TAG;
  json: ThemeTag[];
};

export type ThemeOtherSettingItem = ThemeItemSummary & {
  type: ThemeItemType.OTHERSETTING;
  json: ThemeOtherSetting;
};
export type ThemeTopCustomItem = ThemeItemSummary & {
  type: ThemeItemType.TOPCUSTOM;
  json: ThemeTopCustom[];
};

export type ThemeItem =
  | ThemeImageItem
  | ThemeLabelItem
  | ThemeDatasetItem
  | ThemeCustomItem
  | ThemeTagItem
  | ThemeOtherSettingItem
  | ThemeTopCustomItem;

export interface ThemeItemMapping {
  [ThemeItemType.LABEL]: ThemeLabelItem;
  [ThemeItemType.TAG]: ThemeTagItem;
  [ThemeItemType.DATASET]: ThemeDatasetItem;
  [ThemeItemType.CUSTOM]: ThemeCustomItem;
  [ThemeItemType.OTHERSETTING]: ThemeOtherSettingItem;
  [ThemeItemType.TOPCUSTOM]: ThemeTopCustomItem;
  [ThemeItemType.IMAGE]: ThemeImageItem;
}

export interface CopyThemeItemData {
  sourceItemId: string;
  type: ThemeItemType;
}

export interface CopyThemeItemReq {
  sourceItemId: string;
  targetItemId: string;
  type: ThemeItemType;
}
