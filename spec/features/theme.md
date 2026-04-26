# Theme（主題配置）

## 功能定位（業務語意）

Theme 是系統的展示規格中樞，負責定義「資料如何被看見與操作」，而不是保存原始資料本身。

Theme 的責任可拆成五塊：

1. 資料來源選擇（Dataset）
2. 顯示欄位規則（Label / Image）
3. 操作行為規則（Custom / TopCustom）
4. 過濾規則（Tag）
5. 展示與刷新策略（OtherSetting）

實際資料由 Dataset 提供，Theme 只描述「呈現與互動的規則」。

---

## 路由

| 路徑                      | 頁面                       | 說明                                        |
| ------------------------- | -------------------------- | ------------------------------------------- |
| /                         | ThemeListComponent         | Theme 清單首頁                              |
| /theme-edit               | ThemeEditComponent         | 新增/編輯 Theme（以 query params 判斷模式） |
| /imageList/:name/:version | DataViewImageListComponent | 依 Theme 規格執行圖片清單頁                 |
| /table/:name/:version     | DataViewTableComponent     | 依 Theme 規格執行表格頁                     |

---

## 核心架構：ThemeHeader 與 ThemeItem（過渡並存）

目前 Theme 架構有兩層，且仍在過渡期：

### 1. ThemeHeader（聚合根）

ThemeHeader 提供主鍵與主設定：

- 主鍵：name + version + type
- 其他：title、seq
- 舊結構子欄位：themeImage/themeLabelList/themeDatasetList/themeCustomList/themeTagList/themeOtherSetting

### 2. ThemeItem（分型子資源）

新結構將子設定拆成獨立資源：

- IMAGE
- LABEL
- DATASET
- CUSTOM
- TAG
- OTHERSETTING
- TOPCUSTOM

每個 item 透過 ThemeItemMap（itemId/headerId/type）綁定到 ThemeHeader。

### 3. 為何要同時描述兩層

程式碼顯示 Header 舊欄位與 Item 新架構仍並存，Data View 執行期已偏向使用 ThemeItem，但編輯流程還保留舊資料 fallback。

因此 SDD 不能只寫 ThemeHeader 或只寫 ThemeItem，必須把兩者與映射關係一起寫清楚。

---

## 領域模型（核心）

### ThemeHeader

| 欄位                | 說明             |
| ------------------- | ---------------- |
| name, version, type | 主題識別鍵       |
| title               | 顯示標題         |
| seq                 | 排序序號         |
| themeImage          | 圖片來源規則     |
| themeLabelList      | 欄位規則清單     |
| themeDatasetList    | 資料來源規則清單 |
| themeCustomList     | 列級按鈕規則清單 |
| themeTagList        | 標籤規則清單     |
| themeOtherSetting   | 展示與刷新規則   |

### ThemeItemType

- IMAGE：圖片來源規則
- LABEL：欄位規則陣列
- DATASET：資料來源規則陣列
- CUSTOM：列級按鈕規則陣列
- TAG：標籤規則陣列
- OTHERSETTING：其他設定
- TOPCUSTOM：頁首按鈕規則陣列

### ThemeLabel（欄位顯示規則）

重點欄位：

- byKey：資料鍵
- type：string/stringSplit/seq/fileSize/stringArray/date
- isSearchButton/isSearchValue/isSort/isVisible/isCopy/isDefaultKey
- dateFormat
- width/maxWidth/minWidth
- visibleDatasetNameList/useVisibleDataset（依 dataset 顯示）

### ThemeDataset（資料來源規則）

重點欄位：

- datasetList：可綁多個 dataset 名稱
- label：UI 顯示名稱
- isDefault：預設選擇（同組僅一個）

### ThemeCustom（列級按鈕）

重點欄位：

- type：openUrl/writeNote/copyValue/buttonIconBoolean/buttonIconFill/buttonInputUrl/apiConfig/deleteFile/moveTo/openFolder
- byKey：對應客製值鍵
- label：按鈕文字
- 各 type 對應欄位（openUrl、apiName、moveTo、deleteFile、openFolder、filePathForMoveTo 等）
- visibleDatasetNameList：限制按鈕只在指定 dataset 顯示

### ThemeTopCustom（頁首按鈕）

重點欄位：

- type：openUrl/writeNote/apiConfig
- byKey、label、seq
- openUrl 或 apiName（依 type 必填）

### ThemeOtherSetting（展示策略）

重點欄位：

- rowColor
- listPageSize
- showDuplicate
- checkFileExist
- useQuickRefresh/quickRefresh/quickRefreshType/useSpider
- themeTopCustomList

### ShareTag / ShareTagValue

- ShareTag：shareTagId、shareTagName
- ShareTagValue：shareTagId + value

---

## API 合約（完整）

### ThemeService

| Method | URL                                  | Request                   | Response                    | 說明                  |
| ------ | ------------------------------------ | ------------------------- | --------------------------- | --------------------- |
| GET    | /theme/all                           | —                         | ThemeHeader[]               | 取得全部 Theme        |
| GET    | /theme/id?headerId=...               | —                         | ThemeHeader                 | 依 headerId 取單筆    |
| POST   | /theme/one                           | Partial<ThemeHeader>      | ThemeHeader                 | 條件查單筆            |
| POST   | /theme/exist                         | Partial<ThemeHeader>      | boolean                     | 存在檢查              |
| POST   | /theme/update                        | Partial<ThemeHeader>      | void                        | 新增/更新             |
| POST   | /theme/delete                        | Partial<ThemeHeader>      | void                        | 刪除                  |
| POST   | /theme/copy                          | Partial<CopyThemeRequest> | void                        | 複製 Theme            |
| POST   | /theme/custom/value                  | ThemeCustomValueRequest   | ThemeCustomValueResponse    | 批次查 custom value   |
| POST   | /theme/custom/update                 | ThemeCustomValue          | void                        | 更新 custom value     |
| GET    | /theme/top-custom/value?headerId=... | —                         | ThemeTopCustomValueResponse | 取 top custom value   |
| POST   | /theme/top-custom/update             | ThemeTopCustomValue       | void                        | 更新 top custom value |

補充：findCustomValue 在 valueList 為空時前端直接回 {}。

### ThemeItemService

| Method | URL                                    | Request          | Response              | 說明                      |
| ------ | -------------------------------------- | ---------------- | --------------------- | ------------------------- |
| GET    | /theme/item?type=...&itemId=...        | —                | ThemeItemMapping[K]   | 單一 Item                 |
| GET    | /theme/item/all?type=...               | —                | ThemeItemSummary[]    | 該類型所有 Item 摘要      |
| GET    | /theme/item/header-id?headerId=...     | —                | ThemeItem[]           | 該 Header 綁定的全部 Item |
| GET    | /theme/item/by-type?type=...           | —                | ThemeItemMapping[K][] | 該類型完整 Item           |
| POST   | /theme/item/update                     | ThemeItem        | void                  | 新增/更新 Item            |
| DELETE | /theme/item/delete?type=...&itemId=... | —                | void                  | 刪除 Item                 |
| POST   | /theme/item/copy                       | CopyThemeItemReq | void                  | 複製 Item                 |

### ThemeItemMapService

| Method | URL                                                     | Request      | Response       | 說明                     |
| ------ | ------------------------------------------------------- | ------------ | -------------- | ------------------------ |
| POST   | /theme/item/map/update                                  | ThemeItemMap | void           | 綁定 Item 到 Header      |
| DELETE | /theme/item/map/delete?type=...&itemId=...&headerId=... | —            | void           | 解除綁定                 |
| GET    | /theme/item/map/in-use?type=...&itemId=...              | —            | boolean        | 是否仍被任一 Header 使用 |
| GET    | /theme/item/map/by-type?type=...                        | —            | ThemeItemMap[] | 依類型取綁定關係         |

### ShareTagService

| Method | URL                                              | Request                | Response        | 說明                 |
| ------ | ------------------------------------------------ | ---------------------- | --------------- | -------------------- |
| GET    | /share-tag/all                                   | —                      | ShareTag[]      | 全部標籤             |
| POST   | /share-tag/add                                   | ShareTag               | void            | 新增標籤             |
| GET    | /share-tag/in-use?shareTagId=...                 | —                      | string[]        | 查被哪些 Header 使用 |
| DELETE | /share-tag/delete?shareTagId=...                 | —                      | void            | 刪除標籤             |
| GET    | /share-tag/value/id?shareTagId=...               | —                      | ShareTagValue[] | 取標籤值             |
| POST   | /share-tag/value/by-ids                          | string[]               | ShareTagValue[] | 批次取標籤值         |
| POST   | /share-tag/value/add                             | ShareTagValue          | void            | 新增標籤值           |
| DELETE | /share-tag/value/delete?shareTagId=...&value=... | —                      | void            | 刪除單一標籤值       |
| DELETE | /share-tag/value/delete-list                     | {shareTagId, values[]} | void            | 批次刪除標籤值       |

補充：getShareTagValues 在 ids 為空時前端直接回 []。

### ThemeHiddenService

| Method | URL                               | Request    | Response        | 說明         |
| ------ | --------------------------------- | ---------- | --------------- | ------------ |
| GET    | /theme-hidden/all                 | —          | ThemeHiddenTO[] | 取得隱藏清單 |
| POST   | /theme-hidden/save                | {headerId} | void            | 設為隱藏     |
| DELETE | /theme-hidden/delete?headerId=... | —          | void            | 取消隱藏     |

---

## 編輯流程與驗證規則

### ThemeEdit（主頁）

1. 以 query params 判斷 create/edit。
2. edit 模式鎖定 name/version/type。
3. 儲存前存在性檢查：
   - create 且已存在 -> 阻擋
   - edit 且不存在 -> 阻擋
4. 主表單不合法不可儲存。
5. imageList 型別時 listPageSize 必須大於 0。
6. useQuickRefresh=true 時，useSpider/quickRefreshType/quickRefresh 都必填。

### ThemeItemManage（子設定共用管理）

1. 新增前檢查 type+itemId 不可重複。
2. 編輯模式 itemId 不可修改。
3. 綁定切換：
   - 綁定 -> updateItemMap
   - 解除 -> deleteItemMap
4. 刪除前先檢查 in-use，使用中不可刪。

### Label 規則

1. byKey 不可重複。
2. table 型別需檢查 width/minWidth/maxWidth 為合法 CSS 寬度。
3. isDefaultKey 只能一個 true。

### Dataset 規則

1. 清單不得為空。
2. 每列 datasetList 必須至少一筆。
3. label 不可重複。
4. isDefault 只能一個 true。

### Custom 規則

1. byKey 不可重複。
2. byKey、label 必填。
3. 依 type 動態必填：
   - openUrl -> openUrl
   - copyValue -> copyValue
   - buttonIconFill -> buttonIconFill/buttonIconTrue/buttonIconFalse
   - moveTo -> moveTo/filePathForMoveTo
   - deleteFile -> deleteFile
   - openFolder -> openFolder
   - apiConfig -> apiName
4. 可用 visibleDatasetNameList 限制在特定 dataset 顯示。

### Tag 規則

1. shareTagId 不可重複。
2. shareTagId 必填，且至少一筆有效值。

### TopCustom 規則

1. label、byKey 必填。
2. openUrl 類型必填 openUrl。
3. apiConfig 類型必填 apiName。

---

## 與 Data View 的執行關係（關鍵）

Theme 是 Data View 的執行規格來源，流程如下：

1. HeaderStore 取得 header + items。
2. 依 ThemeItemType 切成 image/label/dataset/custom/tag/topCustom/otherSetting。
3. DataStore 依 dataset 規則載入與合併資料。
4. FilterStore 套用搜尋/排序/標籤/分頁。
5. ResourceStore 補 fileExist 與 customValue。
6. imageList/table 視圖依 ThemeLabel、ThemeCustom 等規則渲染。

因此 Theme 的任一設定變更，都會直接改變 Data View 的可見行為。

---

## 與其他模組關聯

- Dataset：ThemeDataset 決定資料來源，quick refresh 依賴 dataset 流程。
- Api Config：Custom/TopCustom 的 apiConfig 類型會呼叫 API。
- Share Tag：Tag 規則與 Data View 過濾共同使用。
- Core Layout Store：會根據 Theme 預設 sort/dataset 產生初始 query。

---

## 已知風險與過渡區

1. ThemeHeader 舊結構與 ThemeItem 新結構仍在並存過渡期。
2. theme-edit 仍有資料轉移註記，表示舊流程尚未完全移除。
3. 部分模板事件命名與輸出命名有不一致風險，後續需統一。
4. Data View 端仍有部分 any 型別，降低規格可驗證性。

---

## 維護建議（SDD）

每次改 Theme，至少同步更新以下三塊：

1. 模型層：ThemeItemType 與對應 json 結構
2. 表單層：各 editor 驗證規則
3. 執行層：Data View 的消費邏輯

這樣 AI 才能在後續生成與重構時，維持設定與執行的一致性。
