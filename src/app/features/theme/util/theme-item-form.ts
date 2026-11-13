import {
  OpenWindowTargetType,
  ThemeCustom,
  ThemeCustomType,
  ThemeDataset,
  ThemeItem,
  ThemeItemType,
  ThemeLabel,
  ThemeLabelType,
  ThemeTag,
  ThemeTopCustom,
  ThemeTopCustomType,
} from '../models';

/** 建立完整的列資料，供新增與載入舊資料共用。 */
export const createThemeLabelRow = (data: Partial<ThemeLabel> = {}) => {
  return {
    seq: 0,
    byKey: '',
    label: '',
    type: ThemeLabelType.string,
    splitBy: '',
    useSpace: '',
    isSearchButton: false,
    isSearchValue: false,
    isCopy: false,
    isVisible: false,
    isSort: false,
    isDefaultKey: false,
    dateFormat: '',
    width: '',
    maxWidth: '',
    minWidth: '',
    autoComplete: false,
    useVisibleDataset: false,
    visibleDatasetNameList: [] as string[],
    ...data,
  } satisfies ThemeLabel;
};

/** 建立完整的列資料，供新增與載入舊資料共用。 */
export const createThemeDatasetRow = (data: Partial<ThemeDataset> = {}) => {
  return {
    seq: 0,
    datasetList: [] as string[],
    label: '',
    isDefault: false,
    ...data,
  } satisfies ThemeDataset;
};

/** 建立完整的列資料，供新增與載入舊資料共用。 */
export const createThemeCustomRow = (data: Partial<ThemeCustom> = {}) => {
  const group = {
    seq: 0,
    type: ThemeCustomType.openUrl,
    byKey: '',
    label: '',
    apiId: '',
    openUrl: '',
    copyValue: '',
    buttonIconFill: '',
    buttonIconFillColor: '',
    buttonIconTrue: '',
    buttonIconFalse: '',
    moveTo: '',
    filePathForMoveTo: '',
    deleteFile: '',
    openWindowsTarget: OpenWindowTargetType._self,
    openFolder: '',
    visibleDatasetNameList: [] as string[],
    ...data,
  } satisfies ThemeCustom;
  return group;
};

/** 建立完整的列資料，供新增與載入舊資料共用。 */
export const createThemeTagRow = (data: Partial<ThemeTag> = {}) => {
  return {
    seq: 0,
    shareTagId: '',
    ...data,
  } satisfies ThemeTag;
};

/** 建立完整的列資料，供新增與載入舊資料共用。 */
export const createThemeTopCustomRow = (data: Partial<ThemeTopCustom> = {}) => {
  const group = {
    seq: 0,
    type: ThemeTopCustomType.openUrl,
    label: '',
    byKey: '',
    openUrl: '',
    openWindowsTarget: OpenWindowTargetType._blank,
    apiId: '',
    ...data,
  };
  return group;
};

/** 以預設值補齊載入資料，不沿用前一份表單的內容。 */
export function normalizeThemeItem<T extends ThemeItem>(
  data: T,
  defaults: T
): T {
  const item: ThemeItem = {
    ...structuredClone(defaults),
    ...structuredClone(data),
  };
  switch (item.type) {
    case ThemeItemType.LABEL:
      item.json = (item.json ?? []).map(createThemeLabelRow);
      break;
    case ThemeItemType.DATASET:
      item.json = (item.json ?? []).map(createThemeDatasetRow);
      break;
    case ThemeItemType.CUSTOM:
      item.json = (item.json ?? []).map(createThemeCustomRow);
      break;
    case ThemeItemType.TAG:
      item.json = (item.json ?? []).map(createThemeTagRow);
      break;
    case ThemeItemType.TOPCUSTOM:
      item.json = (item.json ?? []).map(createThemeTopCustomRow);
      break;
    case ThemeItemType.IMAGE:
      if (defaults.type === ThemeItemType.IMAGE) {
        item.json = { ...structuredClone(defaults.json), ...item.json };
      }
      break;
    case ThemeItemType.OTHERSETTING:
      if (defaults.type === ThemeItemType.OTHERSETTING) {
        item.json = { ...structuredClone(defaults.json), ...item.json };
      }
      break;
  }
  return item as T;
}
