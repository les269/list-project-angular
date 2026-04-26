# Core Services（共用服務）

> 所有服務位於 `src/app/core/services/`
>
> 所有服務使用 `providedIn: 'root'` 單例模式，可直接 inject 使用。

---

## FileService

**Path**: `file.service.ts`

### 用途

檔案系統操作服務，支援刪除、移動、檢查存在性、開啟資料夾。

### API 端點

| Method | URL                | Request              | Response                              | 說明             |
| ------ | ------------------ | -------------------- | ------------------------------------- | ---------------- |
| POST   | `/file/delete`     | `FileRequest`        | `Observable<boolean>`                 | 刪除檔案         |
| POST   | `/file/move-to`    | `FileRequest`        | `Observable<boolean>`                 | 移動檔案         |
| POST   | `/file/file-exist` | `FileExistRequest[]` | `Observable<Record<string, boolean>>` | 批次檢查檔案存在 |
| POST   | `/file/open-file`  | `FileRequest`        | `Observable<boolean>`                 | 開啟檔案或資料夾 |

### 資料模型

#### FileRequest

```typescript
interface FileRequest {
  filePath: string; // 檔案路徑
  targetPath?: string; // 移動時的目標路徑（moveTo 時使用）
}
```

#### FileExistRequest

```typescript
interface FileExistRequest {
  filePath: string; // 要檢查的檔案路徑
}
```

### 使用範例

```typescript
// 檢查多個檔案是否存在
const requests = [{ filePath: 'C:/file1.jpg' }, { filePath: 'D:/file2.jpg' }];
this.fileService.fileExist(requests).subscribe(result => {
  console.log(result); // { 'C:/file1.jpg': true, 'D:/file2.jpg': false }
});

// 刪除檔案
this.fileService.delete({ filePath: 'C:/temp.txt' }).subscribe();

// 移動檔案
this.fileService
  .moveTo({
    filePath: 'C:/source.txt',
    targetPath: 'D:/target.txt',
  })
  .subscribe();

// 開啟檔案/資料夾
this.fileService.openFolder({ filePath: 'C:/' }).subscribe();
```

---

## MessageBoxService

**Path**: `message-box.service.ts`

### 用途

顯示確認/提示對話框，支援多言語（i18n）。

### 方法

#### openI18N

```typescript
openI18N(
  msg: string,
  obj?: {
    params?: Object;      // i18n 參數替換
    onlyOk?: boolean;     // 若為 true，只顯示「確定」按鈕
  }
): Observable<string>
```

**回傳值**：

- 若使用者按「是/確定」，回傳 `'ok'`
- 若使用者按「否」或關閉對話框，回傳 `undefined`

### 使用範例

```typescript
// 確認對話框
this.messageBoxService
  .openI18N('msg.confirmDelete', {
    params: { name: 'Item Name' },
  })
  .subscribe(result => {
    if (result === 'ok') {
      // 執行刪除
    }
  });

// 只有「確定」按鈕的提示框
this.messageBoxService
  .openI18N('msg.operationSuccess', {
    onlyOk: true,
  })
  .subscribe();
```

---

## SelectTableService

**Path**: `select-table.service.ts`

### 用途

開啟選擇表格 Modal 的便利方法集合，提供各種常見的選擇場景。

### 方法列表

| 方法                           | 簽名                                                                                        | 說明                   |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------- |
| `selectSingleApi`              | `(dataSource: ApiConfig[]) => Observable<ApiConfig>`                                        | 單選 API Config        |
| `selectSingleScrapy`           | `(dataSource: ScrapyConfig[]) => Observable<ScrapyConfig>`                                  | 單選 Scrapy 配置       |
| `selectSingleDataset`          | `(dataSource: Dataset[]) => Observable<Dataset>`                                            | 單選 Dataset           |
| `selectMultipleDataset`        | `(dataSource: Dataset[], selected: Dataset[]) => Observable<Dataset[]>`                     | 多選 Dataset           |
| `selectSingleGroupDataset`     | `(dataSource: GroupDataset[]) => Observable<GroupDataset>`                                  | 單選 Group Dataset     |
| `selectSingleGroupDatasetData` | `(dataSource: GroupDatasetData[]) => Observable<GroupDatasetData>`                          | 單選群組資料（帶搜尋） |
| `selectMutipleTag`             | `(dataSource: ShareTag[], selected: ShareTag[]) => Observable<ShareTag[]>`                  | 多選標籤               |
| `selectSingleShareTag`         | `(dataSource: ShareTag[]) => Observable<ShareTag>`                                          | 單選共享標籤           |
| `selectSingleThemeItemSummary` | `(dataSource: ThemeItemSummary[], idLabelKey: string) => Observable<ThemeItemSummary>`      | 單選主題項目           |
| `selectSingleReplaceValueMap`  | `(dataSource: ReplaceValueMap[]) => Observable<ReplaceValueMap>`                            | 單選替換對照表         |
| `selectMultipleValue`          | `(valueList: string[], selectedValue: string[] \| string) => Observable<{value: string}[]>` | 多選文字值             |
| `selectSingleScrapyPagination` | `(dataSource: ScrapyPagination[]) => Observable<ScrapyPagination>`                          | 單選爬蟲分頁           |
| `selectSingleCookieList`       | `(dataSource: CookieListTO[]) => Observable<CookieListTO>`                                  | 單選 Cookie 清單       |
| `selectSingleSpiderItem`       | `(dataSource: SpiderItem[]) => Observable<SpiderItem>`                                      | 單選 Spider 項目       |

### 共同特性

- 所有方法都透過 MatDialog 開啟 Modal
- 回傳值都已過濾 `undefined`（使用者取消會自動忽略）
- 日期欄位自動格式化為 `'yyyy-MM-dd HH:mm:ss'`
- 標題、欄位標籤都使用 i18n key

### 使用範例

```typescript
// 單選 Dataset
this.selectTableService.selectSingleDataset(datasets).subscribe(dataset => {
  if (dataset) {
    this.form.patchValue({ datasetId: dataset.name });
  }
});

// 多選 Dataset（預勾選已選項）
this.selectTableService
  .selectMultipleDataset(datasets, selectedDatasets)
  .subscribe(results => {
    this.form.patchValue({ datasetList: results });
  });

// 單選群組資料（帶搜尋功能）
this.selectTableService
  .selectSingleGroupDatasetData(groupData)
  .subscribe(data => {
    console.log(data.primeValue); // 主鍵
  });
```

---

## SnackbarService

**Path**: `snackbar.service.ts`

### 用途

顯示短暫提示訊息（toast），支援 i18n。

### 方法

#### isBlankMessage(name: string)

顯示「[欄位名] 不可為空」的訊息。

```typescript
this.snackbarService.isBlankMessage('fieldName');
// 顯示：「fieldName 不可為空」
```

#### openI18N(name: string, obj?: Object)

顯示多言語訊息，預設顯示 5 秒。

```typescript
this.snackbarService.openI18N('msg.operationSuccess');
this.snackbarService.openI18N('msg.confirmDelete', { name: 'Item' });
```

#### openSnackBar(message: string)

顯示純文字訊息，預設顯示 3 秒。

```typescript
this.snackbarService.openSnackBar('Custom message');
```

#### openErrorSnackbar(message: string)

顯示錯誤訊息（紅色背景），包含「Dismiss」按鈕，使用者需手動關閉。

```typescript
this.snackbarService.openErrorSnackbar('An error occurred');
```

### 使用範例

```typescript
// 一般成功訊息
this.snackbarService.openI18N('msg.addSuccess');

// 帶參數的訊息
this.snackbarService.openI18N('msg.saveSuccess', { name: 'Database' });

// 空白檢查
if (!this.form.value.title) {
  this.snackbarService.isBlankMessage('database.configName');
  return;
}

// 錯誤訊息
try {
  // 操作
} catch (error) {
  this.snackbarService.openErrorSnackbar(error.message);
}
```

---

## TranslationService

**Path**: `translation.service.ts`

### 用途

多言語管理，持久化使用者選擇的語言。

### 屬性

| 屬性          | 型別     | 說明                         |
| ------------- | -------- | ---------------------------- |
| `defaultLang` | `string` | 預設語言（初始值 `'zh-tw'`） |

### 方法

#### 初始化（自動執行）

- 讀取 localStorage 中儲存的語言設定
- 若無儲存，使用預設語言 `'zh-tw'`
- 初始化 `TranslateService`

#### changeLang(lang: string)

切換語言並儲存到 localStorage。

```typescript
this.translationService.changeLang('en'); // 切換為英文
this.translationService.changeLang('zh-tw'); // 切換為繁體中文
```

### 儲存位置

- Browser localStorage 鍵名：`'lng'`

### 使用範例

```typescript
// 在語言選擇器中
onLanguageChange(lang: string) {
  this.translationService.changeLang(lang);
  // UI 自動更新（ngx-translate 的 pipe 會自動偵測）
}

// 取得目前語言
const currentLang = this.translationService.translateService.currentLanguage;
```

---

## 服務整合用途

| 場景                             | 推薦服務           |
| -------------------------------- | ------------------ |
| 檔案操作（刪除、移動、檢查存在） | FileService        |
| 確認對話框                       | MessageBoxService  |
| 開啟選擇表格 Modal               | SelectTableService |
| 短暫提示訊息                     | SnackbarService    |
| 多言語切換                       | TranslationService |

---

## 常見組合用法

### 刪除確認 + 執行 + 提示

```typescript
onDeleteClick(item: ItemType) {
  this.messageBoxService.openI18N('msg.confirmDelete', {
    params: { name: item.name }
  }).subscribe(result => {
    if (result === 'ok') {
      this.itemService.delete(item.id).subscribe(() => {
        this.snackbarService.openI18N('msg.deleteSuccess');
        this.refreshList();
      }, error => {
        this.snackbarService.openErrorSnackbar(error.message);
      });
    }
  });
}
```

### 選擇 + 驗證 + 保存

```typescript
onSelectDataset() {
  this.selectTableService.selectSingleDataset(this.datasets)
    .subscribe(dataset => {
      this.form.patchValue({ datasetId: dataset.name });
      this.snackbarService.openI18N('msg.selectSuccess');
    });
}
```
