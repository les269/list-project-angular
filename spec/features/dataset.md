# Dataset（資料集）

## 功能定位（業務語意）

Dataset 模組分成兩層：

1. GroupDataset：單筆資料倉（row store）
2. Dataset：清單視角（list view）

核心關係是：

- GroupDatasetData 以 primeValue 作為單筆識別值，避免同一群組中重複。
- Dataset 不直接維護每一筆資料，而是定義「如何從 GroupDataset 取出多筆資料形成 list」。

換句話說：

- GroupDataset 解決「單筆資料怎麼存、怎麼唯一化」
- Dataset 解決「這批單筆資料要怎麼被挑選與組裝」

---

## 路由

| 路徑                      | 頁面                      | 說明              |
| ------------------------- | ------------------------- | ----------------- |
| /dataset-list             | DatasetListComponent      | Dataset 清單      |
| /dataset-edit             | DatasetEditComponent      | 新增 Dataset      |
| /dataset-edit/:name       | DatasetEditComponent      | 編輯 Dataset      |
| /group-dataset-list       | GroupDatasetListComponent | GroupDataset 清單 |
| /group-dataset-edit       | GroupDatasetEditComponent | 新增 GroupDataset |
| /group-dataset-edit/:name | GroupDatasetEditComponent | 編輯 GroupDataset |

---

## 領域模型與不變條件

### GroupDataset（單筆資料規格）

```typescript
interface GroupDataset {
  groupName: string;
  config: {
    byKey: string;
    type: 'scrapy' | 'api';
    imageSaveFolder: string;
    groupDatasetScrapyList: GroupDatasetScrapy[];
    groupDatasetFieldList: GroupDatasetField[];
    groupDatasetApiList: GroupDatasetApi[];
  };
}
```

重點：

- byKey 是群組資料的「識別欄位名稱」。
- 每筆 GroupDatasetData 的 primeValue 來自 json[byKey]。
- 在同一 groupName 下，primeValue 必須可唯一定位一筆資料（由 exist/check + 後端約束共同保護）。

### GroupDatasetData（單筆資料實體）

```typescript
interface GroupDatasetData {
  groupName: string;
  primeValue: string;
  json: any;
}
```

重點：

- json 是自由結構（schema-flexible）。
- 唯一性是靠 groupName + primeValue 的組合，不是靠固定欄位表。

### Dataset（清單組裝規格）

```typescript
interface Dataset {
  name: string;
  config: {
    type: 'file' | 'folder' | 'all' | 'text' | 'pagination';
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
    scrapyPagination: string;
  };
}
```

重點：

- Dataset 是「取數策略」，不是原始資料儲存。
- 實際展示資料在 DatasetData（datasetName + data[]）中。

---

## GroupDataset 與 Dataset 的組裝邏輯

### A. GroupDataset 層（單筆）

1. 先定義 byKey（例如 id）。
2. 每次新增/更新 GroupDatasetData 時，primeValue 使用 json[byKey]。
3. 以 groupName + primeValue 管理單筆資料，避免同 ID 重複。

### B. Dataset 層（多筆清單）

Dataset 透過 config.type 決定怎麼從 GroupDataset 取資料：

- all：取該群組全部資料。
- file：依檔案名稱/路徑策略取資料。
- folder：依資料夾名稱/路徑策略取資料。
- text：由文字內容（scrapyText）組成來源。
- pagination：依分頁設定（scrapyPagination）逐步獲取。

補充：

- 前端在編輯時只負責設定條件；實際取數與去重在刷新時由後端流程執行。
- 依產品文件，file/folder 流程會更新群組資料，已存在 primeValue 的資料不重複建立。

---

## UI 可見規則（前端）

### DatasetEdit

動態必填規則：

- type=file -> filePath 必填
- type=folder -> folderPath 必填
- type=pagination -> scrapyPagination 必填
- filing=true 且 type 為 file/folder -> filingRegular 必填
- autoImageDownload=true -> imageByKey 必填

保存規則：

- create 模式：existDataset(name) 為 true 則禁止新增。
- edit 模式：existDataset(name) 為 false 則禁止保存。
- name 在 edit 模式會被 disable（不允許變更主鍵）。

### GroupDatasetEdit

保存規則：

- create 模式：existGroupDataset(groupName) 為 true 則禁止新增。
- edit 模式：existGroupDataset(groupName) 為 false 則禁止保存。
- groupName 在 edit 模式會被 disable。

子表格規則：

- groupDatasetFieldList：key、label 必填。
- groupDatasetScrapyList：name、label 必填。
- groupDatasetApiList：apiName、label 必填。

### EditGroupDatasetData（單筆資料編修）

關鍵流程：

- 先依 groupName 讀取 GroupDatasetConfig。
- 依欄位型別預設 json：
  - string -> ''
  - stringArray -> []
- searchByPrimeValue 前會先檢查 primeValue 是否存在。
- 更新時 payload：

```typescript
{
	groupName,
	primeValue: json[groupDatasetConfig.byKey],
	json
}
```

這裡明確反映：primeValue 由 byKey 映射而來。

---

## Service API 合約（完整）

### DatasetService

| Method | URL                         | Request               | Response      | 說明                         |
| ------ | --------------------------- | --------------------- | ------------- | ---------------------------- |
| GET    | /dataset/get?name=...       | —                     | Dataset       | 取 Dataset 設定              |
| GET    | /dataset/get-data?name=...  | —                     | DatasetData   | 取 Dataset 組裝後資料        |
| POST   | /dataset/name-list/get-data | string[]              | DatasetData[] | 批次取多個 Dataset 的資料    |
| GET    | /dataset/exist?name=...     | —                     | boolean       | 名稱存在檢查                 |
| GET    | /dataset/all                | —                     | Dataset[]     | 清單                         |
| POST   | /dataset/update             | Partial<Dataset>      | void          | 新增/更新                    |
| DELETE | /dataset/delete?name=...    | —                     | void          | 刪除                         |
| GET    | /dataset/refresh?name=...   | —                     | void          | 重新組裝單一 Dataset         |
| POST   | /dataset/name-list/refresh  | string[]              | void          | 批次刷新                     |
| POST   | /dataset/quick-refresh      | DatasetQuickRefreshTO | any           | 單筆快速刷新（回傳未強型別） |

備註：findDatasetDataByNameList 於 nameList 為空時直接回傳 []，不發 HTTP。

### GroupDatasetService

| Method | URL                                  | Request               | Response       | 說明                |
| ------ | ------------------------------------ | --------------------- | -------------- | ------------------- |
| GET    | /group-dataset/get?groupName=...     | —                     | GroupDataset   | 取群組設定          |
| GET    | /group-dataset/exist?groupName=...   | —                     | boolean        | 群組存在檢查        |
| GET    | /group-dataset/all                   | —                     | GroupDataset[] | 清單                |
| POST   | /group-dataset/update                | Partial<GroupDataset> | void           | 新增/更新           |
| DELETE | /group-dataset/delete?groupName=...  | —                     | void           | 刪除                |
| GET    | /group-dataset/refresh?groupName=... | —                     | void           | 重新抓取/整理該群組 |

### GroupDatasetDataService

| Method | URL                                                           | Request                     | Response           | 說明                    |
| ------ | ------------------------------------------------------------- | --------------------------- | ------------------ | ----------------------- |
| GET    | /group-dataset-data/get?groupName=...&primeValue=...          | —                           | GroupDatasetData   | 取單筆                  |
| GET    | /group-dataset-data/exist?groupName=...&primeValue=...        | —                           | boolean            | 單筆存在檢查            |
| GET    | /group-dataset-data/all?groupName=...                         | —                           | GroupDatasetData[] | 取全部單筆              |
| GET    | /group-dataset-data/all-only-prime-value?groupName=...        | —                           | GroupDatasetData[] | 只取主鍵清單用途        |
| POST   | /group-dataset-data/update                                    | Partial<GroupDatasetData>   | void               | 新增/更新單筆           |
| POST   | /group-dataset-data/update-list                               | Partial<GroupDatasetData[]> | void               | 批次更新                |
| DELETE | /group-dataset-data/delete?groupName=...&primeValue=...       | —                           | void               | 刪除單筆                |
| DELETE | /group-dataset-data/delete-image?groupName=...&primeValue=... | —                           | string             | 刪除圖片並回傳路徑/訊息 |

---

## 一致性與資料品質規則

1. GroupDataset 的 byKey 一旦決定，所有單筆資料的 primeValue 都依此推導。
2. 同 groupName 下不可有重複 primeValue（由檢查流程與後端共同保障）。
3. Dataset 必須綁定 groupName 才有資料來源。
4. Dataset 的 type 是「取數策略」，不是資料實體型別。
5. Dataset refresh 是把 GroupDataset 的單筆資料重新組裝為 list，而不是直接編輯 GroupDatasetData。

---

## 與其他功能關聯

- Api Config：GroupDatasetApi 可掛接 API 取得資料。
- Spider：Dataset/GroupDataset 的資料獲取來源之一（現況仍在演進）。
- Replace Value Map：GroupDatasetField 可做值轉換。
- Theme + Data View：讀取 DatasetData 作為最終展示來源。

---

## 已知限制與待補

1. /dataset/quick-refresh 回傳 any，尚未有明確型別。
2. file/folder/text/pagination 的最終組裝細節主要在後端，前端規格描述的是觸發條件與可見行為。
3. 若未來 Spider 完整替換舊流程，需同步調整本文件的來源描述。
