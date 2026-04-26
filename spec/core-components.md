# Core Components（共用元件）

> 所有元件位於 `src/app/core/components/`
>
> **使用建議**：開發新功能時，優先檢查此文件是否已有可用元件，避免重複造輪。

---

## ChipInputComponent

**Path**: `chip-input/chip-input.component.ts`

### 用途

帶有 chip 顯示的文字輸入框，支援多個標籤/值的輸入與編輯。

### Inputs (input signals)

| 名稱              | 型別                                         | 預設         | 說明                                                  |
| ----------------- | -------------------------------------------- | ------------ | ----------------------------------------------------- |
| `label`           | `string`                                     | —            | input 的標籤文字                                      |
| `type`            | `'text' \| 'color'`                          | `'text'`     | 輸入類型：`'text'` 為一般文字，`'color'` 為顏色選擇器 |
| `allowDuplicates` | `boolean`                                    | `false`      | 是否允許重複值                                        |
| `canUpdate`       | `(value: string, index?: number) => boolean` | `() => true` | 自訂驗證函數，判斷值是否有效（新增/編輯時觸發）       |

### Outputs (model signal)

| 名稱       | 型別               | 說明                |
| ---------- | ------------------ | ------------------- |
| `chipList` | `Signal<string[]>` | 雙向綁定：chip 清單 |

### ControlValueAccessor 支援

✅ 支援 `formControlName`、`[(ngModel)]` 等 Angular form 綁定

### 行為

- 使用者輸入內容後按 Enter 或移出焦點（blur）時，新增到列表
- 每個 chip 可內聯編輯：點擊 chip 後可修改
- 點擊 chip 上的 ✕ 按鈕移除該 chip
- 若 `type === 'color'`，會顯示顏色選擇器（HTML5 `<input type="color">`），並根據色彩亮度自動調整文字顏色

### 使用範例

```html
<!-- 基本用法 -->
<app-chip-input [(chipList)]="tags" [label]="'標籤'" [type]="'text'" />

<!-- 帶驗證的用法 -->
<app-chip-input
  [(chipList)]="colors"
  [label]="'選擇顏色'"
  [type]="'color'"
  [canUpdate]="validateColor"
  [allowDuplicates]="false" />
```

### 注意事項

- 使用 Signal 的 `update()` 確保每次修改都能觸發值變動通知
- 內部呼叫 `onChange()` 同步到 form control

---

## ChipSelectButtonComponent

**Path**: `chip-select-button/chip-select-button.component.ts`

### 用途

單選模式的選擇器，以 chip 顯示已選項，按鈕開啟選擇表格。常用於「從清單中選一個」的場景。

### Inputs (input signals)

| 名稱          | 型別                                | 必填 | 說明                                             |
| ------------- | ----------------------------------- | ---- | ------------------------------------------------ |
| `valueKey`    | `any`                               | ✓    | 資料對象中的主鍵欄位名                           |
| `selectTable` | `() => Observable<any>`             | ✓    | 呼叫此函數開啟選擇表格，回傳選中物件             |
| `options`     | `any[] \| (() => any[])`            | ✓    | 可選項陣列，可為純陣列或 Signal 函數（自動解析） |
| `labelKey`    | `string \| ((item: any) => string)` | ✓    | 顯示文字的欄位名或格式化函數                     |
| `required`    | `boolean`                           | —    | 是否為必填                                       |
| `requiredMsg` | `string`                            | —    | 必填時的提示訊息（預設使用 i18n key）            |

### Outputs (signals)

| 名稱           | 型別                  | 說明               |
| -------------- | --------------------- | ------------------ |
| `value`        | `Signal<string>`      | 已選項的值（主鍵） |
| `selectedData` | `Signal<any \| null>` | 已選項的完整物件   |

### ControlValueAccessor 支援

✅ 支援 `formControlName`、`[(ngModel)]` 等 Angular form 綁定

### 行為

- 按鈕開啟選擇表格，使用者選後自動填入 chip 與 value
- `options` 為 async 載入時，當 options 更新後會自動在本地 options 中補找並設定 `selectedData`
- 點擊 chip 上的 ✕ 移除選擇
- 當值改變時自動更新 form control

### 使用範例

```html
<!-- 基本用法 -->
<app-chip-select-button
  [formControlName]="'datasetId'"
  [valueKey]="'id'"
  [options]="datasets()"
  [labelKey]="'name'"
  [selectTable]="openDatasetSelector.bind(this)" />

<!-- 必填且自訂格式化 -->
<app-chip-select-button
  [formControlName]="'scrapyId'"
  [valueKey]="'name'"
  [options]="scrapyList"
  [labelKey]="item => item.name + ' (' + item.type + ')'"
  [selectTable]="selectScrapy.bind(this)"
  [required]="true"
  [requiredMsg]="'msg.requiredScrapy'" />
```

### 注意事項

- 當選擇表格返回值時，valueKey 對應的值會存入 form control
- `selectedData` 用於顯示 chip 的文字，由 `labelKey` 格式化
- 若後端資料未來才載入 options，元件內部透過 `effect()` 自動補找

---

## ChipSelectMultipleButtonComponent

**Path**: `chip-select-multiple-button/chip-select-multiple-button.component.ts`

### 用途

多選模式的選擇器，以多個 chips 顯示已選項，常用於「從清單中選多個」的場景。

### Inputs (input signals)

| 名稱          | 型別                                     | 必填 | 說明                                                         |
| ------------- | ---------------------------------------- | ---- | ------------------------------------------------------------ |
| `valueKey`    | `string \| number \| symbol`             | ✓    | 資料對象中的主鍵欄位名                                       |
| `selectTable` | `(selected: any[]) => Observable<any[]>` | ✓    | 呼叫此函數開啟選擇表格，傳入已選項供預勾選，回傳新的選中陣列 |
| `options`     | `any[]`                                  | ✓    | 可選項陣列                                                   |
| `labelKey`    | `string \| ((item: any) => string)`      | ✓    | 顯示文字的欄位名或格式化函數                                 |
| `required`    | `boolean`                                | —    | 是否為必填                                                   |
| `requiredMsg` | `string`                                 | —    | 必填時的提示訊息                                             |

### Outputs (signals)

| 名稱           | 型別            | 說明                       |
| -------------- | --------------- | -------------------------- |
| `values`       | `Signal<any[]>` | 已選項的值陣列（主鍵列表） |
| `selectedData` | `Signal<any[]>` | 已選項的完整物件陣列       |

### ControlValueAccessor 支援

✅ 支援 `formControlName`、`[(ngModel)]` 等 Angular form 綁定（雙向綁定的值為 `values` 的陣列）

### 行為

- 按鈕開啟選擇表格，表格預勾選已選項
- 使用者確認選擇後，`selectedData` 與 `values` 同步更新
- 點擊個別 chip 上的 ✕ 移除該項
- 移除時同時更新 `values`（主鍵清單）與 `selectedData`（物件清單）

### 使用範例

```html
<!-- 基本用法 -->
<app-chip-select-multiple-button
  [formControlName]="'themeDatasetIds'"
  [valueKey]="'name'"
  [options]="datasets"
  [labelKey]="'name'"
  [selectTable]="selectMultipleDatasets.bind(this)"
  [required]="true" />
```

### 注意事項

- Form control 綁定的值為 `values[]`（主鍵陣列）
- `selectedData` 用於顯示 chips，自動與 options 同步
- 當選擇表格返回新陣列時，會完全替換 `values` 與 `selectedData`

---

## GenericTableComponent

**Path**: `generic-table/generic-table.component.ts`

### 用途

通用的表格元件，支援多種欄位類型（輸入框、下拉選單、checkbox、radio、chip 選擇器等），以及拖拽排序、新增行、刪除行、表單驗證。

### Inputs (input signals)

| 名稱               | 型別                           | 說明                                            |
| ------------------ | ------------------------------ | ----------------------------------------------- |
| `formArray`        | `FormArray`                    | 必填，表格的資料來源（每行為一個 FormGroup）    |
| `cols`             | `GenericTableColumn[]`         | 必填，欄位定義陣列                              |
| `displayedColumns` | `string[]`                     | 必填，要顯示的欄位 key 清單（順序決定顯示順序） |
| `createGroup`      | `(data?: any) => FormGroup`    | 必填，建立新行的工廠函數                        |
| `initData`         | `any[]?`                       | 可選，初始資料（若有傳入會自動填入 formArray）  |
| `customColTmpls`   | `Record<string, TemplateRef>`? | 可選，自訂欄位模板                              |
| `expandedTmpl`     | `TemplateRef`?                 | 可選，列展開模板                                |

### Outputs

- 無直接 output，所有變更同步回 `formArray`

### GenericTableColumn 結構

```typescript
interface GenericTableColumn {
  key: string; // 欄位 key（對應 FormGroup 的 control name）
  label: string; // i18n key 或顯示標籤
  columnType: GenericColumnType; // 欄位類型
  width?: string; // CSS width（如 '100px', '20%'）
  minWidth?: string;
  maxWidth?: string;
  data?: any[]; // 當 columnType 為 select/chipSelect 等時的可選值
  dataValue?: string; // data 陣列中作為 value 的欄位名
  dataLabel?: string | ((item: any) => string); // data 陣列中作為 label 的欄位名或函數
  openDialog?: (selected?: any[]) => Observable<any[]>; // chip select 時的選擇器函數
  required?: boolean;
  requiredMsg?: string;
  error?: { name: string; msg: string }[]; // 自訂驗證錯誤
}
```

### GenericColumnType 列舉

```
input      - 文字輸入框
textarea   - 多行文字框
select     - 下拉選單
checkbox   - 複選框
radio      - 單選按鈕（該行獨佔一個 radio）
chipSelect - 單選 chip 選擇器
chipSelectMultiple - 多選 chip 選擇器
custom     - 自訂模板
```

### 行為

- **拖拽排序**：滑鼠滑過 seq 欄位時顯示 reorder icon，按下可拖拽排序；拖拽後自動更新所有行的 seq
- **新增行**：表格底部「+」按鈕，點擊會呼叫 `createGroup()` 建立新行
- **刪除行**：每行最右邊有刪除按鈕，點擊移除該行
- **表單驗證**：支援 `required`、`minlength` 等標準 validator，以及自訂 `error` 陣列
- **Blur 時 Trim**：輸入框使用 `trimOnBlur` directive，失焦時自動移除前後空白

### 使用範例

```typescript
// 在 component.ts 中

const form = this.fb.group({
  themeLabels: this.fb.array([
    this.fb.group({
      seq: 1,
      byKey: 'title',
      type: 'string',
      isSort: false,
    }),
  ]),
});

labelColumns: GenericTableColumn[] = [
  {
    key: 'byKey',
    label: 'themeLabel.byKey',
    columnType: GenericColumnType.input,
    required: true,
    requiredMsg: 'msg.fieldRequired',
  },
  {
    key: 'type',
    label: 'themeLabel.type',
    columnType: GenericColumnType.select,
    data: ['string', 'date', 'number'],
    dataValue: 'string',
    dataLabel: item => item,
  },
];
```

```html
<!-- template 中 -->
<app-generic-table
  [formArray]="form.get('themeLabels')"
  [cols]="labelColumns"
  [displayedColumns]="['byKey', 'type']"
  [createGroup]="createLabelGroup.bind(this)"
  [initData]="initialLabels" />
```

### 注意事項

- 每行的 `seq` 欄位由元件自動維護（新增、刪除、排序後自動更新）
- 拖拽時需確保 formArray 中的每個 FormGroup 都有 `seq` control
- `initData` 變更時會完全重新渲染表格
- 表單驗證錯誤訊息支援 i18n 參數傳遞

---

## FixedImageComponent

**Path**: `fixed-image/fixed-image.component.ts`

### 用途

全屏圖片浮層預覽器，支援縮放、下載、開啟新視窗。

### Inputs (input signals)

| 名稱             | 型別     | 必填 | 說明     |
| ---------------- | -------- | ---- | -------- |
| `fixedImagePath` | `string` | ✓    | 圖片 URL |

### Public Methods

| 方法              | 說明                              |
| ----------------- | --------------------------------- |
| `show()`          | 顯示浮層（`isVisible` 設為 true） |
| `closeModal()`    | 關閉浮層                          |
| `downloadImage()` | 下載圖片                          |
| `openNewWindow()` | 開啟新視窗顯示圖片                |

### Signals

| 名稱        | 型別              | 說明                       |
| ----------- | ----------------- | -------------------------- |
| `isVisible` | `Signal<boolean>` | 是否顯示浮層               |
| `zoomLevel` | `Signal<number>`  | 縮放等級（目前未用，預留） |

### 樣式與行為

- 背景為半透明黑色（`rgba(0,0,0,0.7)`）
- 圖片容器在中央，最大寬高為 70vw / 70vh
- 頂部右角有三個按鈕：開啟新視窗、下載、關鈕
- 點擊背景區域可關閉浮層
- 開啟時自動禁止 body 滾動，關閉時恢復

### 使用範例

```typescript
// component.ts
@ViewChild(FixedImageComponent) imageViewer!: FixedImageComponent;

onImageClick(imageUrl: string) {
  this.imageViewer.fixedImagePath.set(imageUrl);
  this.imageViewer.show();
}
```

```html
<!-- template -->
<app-fixed-image [fixedImagePath]="currentImageUrl()" />
```

---

## FormAlertsComponent

**Path**: `form-alerts/form-alerts.component.ts`

### 用途

表單級別的錯誤訊息展示，用於顯示整個表單或欄位的錯誤提示。

### Inputs (input signals)

| 名稱         | 型別              | 必填 | 說明                                     |
| ------------ | ----------------- | ---- | ---------------------------------------- |
| `form`       | `AbstractControl` | ✓    | 表單 control（FormGroup 或 FormControl） |
| `formAlerts` | `FormAlert[]`     | ✓    | 錯誤定義陣列（含 errorId 與 msg）        |

### FormAlert 模型

```typescript
interface FormAlert {
  errorId: string; // 對應 control.hasError() 的 key
  msg: string; // 顯示的訊息（i18n key）
}
```

### 行為

- 遍歷 `formAlerts` 陣列，針對每個 alert 檢查 `form.hasError(errorId)`
- 若有 error，顯示該 alert 的訊息
- 會自動調用 translate pipe 翻譯訊息

### 使用範例

```html
<app-form-alerts
  [form]="form"
  [formAlerts]="[
    { errorId: 'required', msg: 'msg.requiredField' },
    { errorId: 'pattern', msg: 'msg.invalidFormat' }
  ]" />
```

---

## FormInvalidsComponent

**Path**: `form-invalids/form-invalids.component.ts`

### 用途

欄位級別的驗證錯誤展示，通常搭配 Bootstrap 的 invalid feedback 樣式。

### Inputs (input signals)

| 名稱         | 型別              | 必填 | 說明                        |
| ------------ | ----------------- | ---- | --------------------------- |
| `control`    | `AbstractControl` | ✓    | 表單 control（FormControl） |
| `formAlerts` | `FormInvalid[]`   | ✓    | 驗證錯誤定義陣列            |

### FormInvalid 模型

```typescript
interface FormInvalid {
  errorId: string; // 對應 control.hasError() 的 key
  msg: string; // 顯示的訊息（i18n key）
}
```

### 行為

- 只在 `control.touched === true` 時顯示錯誤訊息
- 遍歷 `formAlerts`，檢查 `control.hasError(errorId)`
- CSS class 固定為 `invalid-feedback`（Bootstrap 標準樣式）

### 使用範例

```html
<input
  [formControl]="nameControl"
  [class.is-invalid]="nameControl.invalid && nameControl.touched" />
<app-form-invalids
  [control]="nameControl"
  [formAlerts]="[
    { errorId: 'required', msg: 'msg.nameRequired' },
    { errorId: 'minlength', msg: 'msg.nameTooShort' }
  ]" />
```

---

## MessageBoxComponent

**Path**: `message-box/message-box.component.ts`

### 用途

Modal 對話框，用於向使用者確認或提示。

### 使用方式

通常不直接使用此元件，而是透過 `MessageBoxService` 呼叫：

```typescript
this.messageBoxService
  .openI18N('msg.confirmDelete', {
    params: { name: 'Item Name' },
    onlyOk: false,
  })
  .subscribe(result => {
    if (result === 'ok') {
      // 使用者確認
    }
  });
```

### MessageBoxData 介面

```typescript
interface MessageBoxData {
  message: string; // 要顯示的訊息
  onlyOk?: boolean; // 若為 true，只顯示「確定」按鈕；否則顯示「是」與「否」
}
```

### 按鈕行為

- 若 `onlyOk === true`：只顯示「確定」按鈕，點擊回傳 `'ok'`
- 若 `onlyOk === false`：顯示「是」與「否」兩按鈕，點擊「是」回傳 `'ok'`，點擊「否」回傳 `undefined`

---

## ScrollTopComponent

**Path**: `scroll-top/scroll-top.component.ts`

### 用途

頁面右下角的「回到頂部」浮動按鈕，監聽滾動事件自動顯示/隱藏。

### 行為

- 監聽 `window:scroll` 事件
- 當 `window.pageYOffset > 100px` 時顯示按鈕
- 點擊時以 `smooth` 動畫滾動到頁頂
- 按鈕自動出現/消失，無需外部控制

### 使用範例

```html
<!-- 在主頁面最上層放置即可 -->
<app-scrollTop></app-scrollTop>
```

---

## SelectTableComponent / SelectTableDialog

**Path**: `select-table/select-table.dialog.ts`

### 用途

通用的選擇表格 Modal，支援單選和多選模式。

### 使用方式

通常透過 `SelectTableService` 的便利方法呼叫，例如：

```typescript
this.selectTableService.selectSingleDataset(datasets).subscribe(result => {
  if (result) {
    // 使用者選了一個 dataset
    this.selectedDataset = result;
  }
});

this.selectTableService
  .selectMultipleDataset(datasets, selectedOnes)
  .subscribe(results => {
    if (results) {
      // 使用者選了多個
      this.selectedDatasets = results;
    }
  });
```

### BaseSelectTableData 介面

```typescript
interface BaseSelectTableData<T> {
  displayedColumns: (keyof T)[]; // 顯示的欄位名陣列
  labels: string[]; // 對應欄位的 i18n key
  dataSource: T[]; // 可選項陣列
  selectType: 'single' | 'multiple'; // 選擇模式
  columnFormats?: Record<keyof T, (val: any) => string>; // 欄位格式化函數
  columnSorts?: Record<keyof T, boolean>; // 欄位是否可排序
  title?: string; // 標題（i18n key）
  selected?: T[]; // 預選項（多選模式）
  enableFilter?: boolean; // 是否顯示搜尋框
  showTitle?: boolean; // 是否顯示標題
}
```

### 功能

- **單選模式**：點擊行直接回傳該物件
- **多選模式**：checkbox 選擇，確定按鈕回傳選中陣列
- **搜尋/過濾**：輸入框即時過濾資料
- **排序**：點擊欄位標題排序（若 `columnSorts` 允許）
- **分頁**：預設每頁 100 筆，可修改

### 常見使用場景的便利方法（在 SelectTableService 中）

- `selectSingleApi()` - 選一個 API Config
- `selectSingleScrapy()` - 選一個 Scrapy
- `selectSingleDataset()` - 選一個 Dataset
- `selectMultipleDataset()` - 選多個 Dataset
- `selectSingleGroupDataset()` - 選一個 Group Dataset
- ...等等

---

## CustomMatPaginatorIntl

**Path**: `custom-mat-paginatorIntl/custom-mat-paginatorIntl.ts`

### 用途

自訂 Material Paginator 的國際化文字，支援多語言切換。

### 說明

- 自動從 i18n 中讀取 paginator 相關的標籤文字
- 替換 `itemsPerPageLabel`、`nextPageLabel`、`previousPageLabel` 等
- 自訂 `getRangeLabel`，顯示「第 X-Y 筆，共 Z 筆」的格式

### 使用

通常作為 provider 自動注入到需要 paginator 的元件中：

```typescript
@Component({
  // ...
  providers: [
    { provide: MatPaginatorIntl, useClass: CustomMatPaginatorIntl }
  ]
})
```

---

## 元件總結表

| 元件                              | 用途           | 型別    | Form 綁定      |
| --------------------------------- | -------------- | ------- | -------------- |
| ChipInputComponent                | 多標籤輸入     | Input   | ✅             |
| ChipSelectButtonComponent         | 單選下拉       | Select  | ✅             |
| ChipSelectMultipleButtonComponent | 多選下拉       | Select  | ✅             |
| GenericTableComponent             | 通用表格       | Table   | ✅ (FormArray) |
| FixedImageComponent               | 圖片浮層       | Modal   | ❌             |
| FormAlertsComponent               | 表單級錯誤提示 | Display | ❌             |
| FormInvalidsComponent             | 欄位級錯誤提示 | Display | ❌             |
| MessageBoxComponent               | 確認對話框     | Modal   | ❌             |
| ScrollTopComponent                | 回到頂部按鈕   | Widget  | ❌             |
| SelectTableDialog                 | 選擇表格 Modal | Modal   | ❌             |
| CustomMatPaginatorIntl            | 分頁國際化     | Service | ❌             |
