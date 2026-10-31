import { CssSelect } from '../model';

/** 補齊 CSS 選擇器欄位，供載入資料與新增列共用。 */
export const createCssSelect = (data: Partial<CssSelect> = {}) =>
  ({
    seq: 0,
    key: '',
    value: '',
    replaceString: '',
    attr: '',
    convertToArray: false,
    onlyOwn: false,
    replaceRegular: '',
    replaceRegularTo: '',
    replaceValueMapName: '',
    splitText: '',
    ...data,
  }) satisfies CssSelect;
