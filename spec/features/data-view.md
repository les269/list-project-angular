# Data View（資料瀏覽執行層）

## 功能定位（業務語意）

Data View 是 Theme 的執行層，負責將 Theme 規格轉換為使用者可見的互動介面。
它本身不保存設定，也不定義顯示規則，全部依賴 HeaderStore 從 Theme 讀進來的指令運作。

Data View 的責任可以拆成六塊：

1. 讀取 Theme 規格（HeaderStore）
2. URL Query Params 同步與防護（RouteStore）
3. 載入並組裝資料（DataStore）
4. 搜尋、排序、標籤過濾、分頁（FilterStore）
5. 補齊執行期資源（檔案存在性 / Custom Value）（ResourceStore）
6. UI 暫態狀態（hover / quickRefresh cache / 圖片放大）（UIStateStore）

六個 Store 組成一個單向資料流，最終輸出 `viewData` 給視圖渲染。

---

## 路由

| 路徑                      | 頁面                   | 說明             |
| ------------------------- | ---------------------- | ---------------- |
| /imageList/:name/:version | ImageListViewComponent | 圖片卡片清單視圖 |
| /table/:name/:version     | TableViewComponent     | 表格視圖         |

路徑參數 `:name` + `:version` + 路由 data 中的 `type`（imageList / table）組成 `headerId`，
作為所有後續 Store 的主鍵。

---

## Store 架構總覽

```
HeaderStore   ─── ThemeItems (rxResource)
     │
     ▼
RouteStore    ─── URL Query Params (linkedSignal + effect 防護)
     │
     ▼
DataStore     ─── DatasetData (rxResource) + ShareTagValues (rxResource)
     │
     ▼
FilterStore   ─── 搜尋 → tag過濾 → 排序 → 分頁 → viewData
     │
     ▼
ResourceStore ─── fileExist (rxResource) + customValueMap (rxResource)
     │
     ▼
View          ─── imageList / table
```

**ListBaseViewStoreAdapter**：Facade，注入並代理所有 Store 的公開屬性，
供視圖元件注入一個入口點。原始元件全部注入此 Adapter，逐步遷移中。

---

## 一、HeaderStore

### 職責

- 依 `headerId` 載入 `ThemeHeader` 與 `ThemeItem[]`
- 從 ThemeItems 中計算出各類型的衍生 signal

### headerId 計算

```
name (route param) + version (route param) + type (route data) → getHeaderId()
```

name 或 version 為空時，headerId = ''（視圖導回首頁）。

### rxResource

| 名稱              | API                                      | 說明                                           |
| ----------------- | ---------------------------------------- | ---------------------------------------------- |
| themeHeader       | GET /theme/id?headerId=...               | 載入後更新 document.title 與 layoutStore.title |
| themeItems        | GET /theme/item/header-id?headerId=...   | 依 headerId 取全部 ThemeItem                   |
| topCustomValueMap | GET /theme/top-custom/value?headerId=... | 頁首按鈕自訂值                                 |

### 衍生 computed（從 themeItems 切出）

| 名稱               | 來源 ThemeItemType | 說明                                                 |
| ------------------ | ------------------ | ---------------------------------------------------- |
| themeImage         | IMAGE              | 圖片來源規則；非 imageList 類型時為 undefined        |
| themeOtherSetting  | OTHERSETTING       | 展示策略（pageSize / quickRefresh / checkFileExist） |
| visibleLabelList   | LABEL              | 過濾 isVisible=true + 排 sortSeq                     |
| themeDatasetList   | DATASET            | 按 sortSeq 排序                                      |
| themeTagList       | TAG                | seq 強制轉 number + sortSeq                          |
| themeCustomList    | CUSTOM             | 按 sortSeq 排序                                      |
| themeTopCustomList | TOPCUSTOM          | 按 sortSeq 排序                                      |

### 進一步衍生

| 名稱             | 說明                                               |
| ---------------- | -------------------------------------------------- |
| defaultSortLabel | visibleLabelList 中第一個 isSort=true 的 byKey     |
| displayedColumns | visibleLabelList 的 byKey 陣列 + 最後加 'other'    |
| seqKey           | type='seq' 的 label 的 byKey（無則 ''）            |
| defaultKey       | isDefaultKey=true 的 label 的 byKey                |
| defaultDataset   | isDefault=true 的 dataset 的 seq，或第一筆         |
| rowColor         | themeOtherSetting.rowColor，無則 DEFAULT_ROW_COLOR |

---

## 二、RouteStore

### 職責

- 將 URL Query Params 對應到 signal（用 linkedSignal 追蹤）
- 提供 `patchQuery(action)` 統一更新 URL
- 在 constructor effect 中驗證並修正非法 query params

### Query Params Schema

| 參數        | 型別    | 預設值             | 合法規則                                       |
| ----------- | ------- | ------------------ | ---------------------------------------------- |
| searchValue | string  | ''                 | 無限制                                         |
| sort        | string  | defaultSortLabel   | 必須是 visibleLabelList 的 byKey 或 `__random` |
| asc         | boolean | true               | 只能是 'true' 或 'false' 字串                  |
| page        | number  | 1                  | 正整數，≥1                                     |
| dataset     | number  | defaultDataset.seq | 必須存在於 themeDatasetList                    |
| tag         | number  | -1                 | -1 或存在於 themeTagList                       |

### 防護邏輯

1. 等待 themeHeader 載入完成後才執行驗證
2. 比對 current params vs validated params
3. 若不同則 `router.navigate([], { queryParams: validated })`，避免死循環

### linkedSignal 對應

```
queryParamsSearchValue → searchValue (linkedSignal)
queryParamsPage        → page        (linkedSignal)
queryParamsSort        → sortKey     (linkedSignal)
queryParamsAsc         → ascFlag     (linkedSignal)
queryParamsDataset     → datasetSeq  (linkedSignal)
queryParamsShareTag    → shareTagSeq (linkedSignal)
```

### QueryAction 類型

| type    | 說明       | 相關欄位    |
| ------- | ---------- | ----------- |
| search  | 更新搜尋值 | searchValue |
| sort    | 更新排序   | key, asc    |
| page    | 更新分頁   | page        |
| dataset | 切換資料集 | seq         |
| tag     | 切換標籤   | seq         |

---

## 三、DataStore

### 職責

- 依 themeDatasetList 載入全部 DatasetData
- 組裝 `datasetDataMap`（ThemeDataset → DatasetData[]）
- 依目前選定的 dataset 輸出 `useData`
- 管理 ShareTag 相關資源

### 常數

| 名稱             | 值              | 說明                            |
| ---------------- | --------------- | ------------------------------- |
| RANDOM_KEY       | `__random`      | 每筆資料附加隨機排序用的 uint32 |
| DATASET_NAME_KEY | `__datasetName` | 每筆資料附加來源 datasetName    |

### rxResource

| 名稱              | API                          | 條件                                                        |
| ----------------- | ---------------------------- | ----------------------------------------------------------- |
| datasetDataList   | POST /dataset/data/name-list | params = 全部 themeDataset 的 datasetList 合集（去重）      |
| shareTagValueList | POST /share-tag/value/by-ids | params = themeTagList 的 shareTagId 陣列；空時前端直接回 [] |
| allShareTag       | GET /share-tag/all           | 無條件                                                      |

### 關鍵 computed

| 名稱             | 說明                                                           |
| ---------------- | -------------------------------------------------------------- |
| datasetDataMap   | ThemeDataset → DatasetData[] 的映射陣列                        |
| useDataset       | 依 routeStore.datasetSeq → isDefault → 第一筆，三段 fallback   |
| useData          | 當前 useDataset 的資料，每筆注入 RANDOM_KEY + DATASET_NAME_KEY |
| useDataNameSet   | 當前 useData 中 defaultKey 值的 Set（供 tag 計數）             |
| useShareTag      | 依 routeStore.shareTagSeq 找出 ThemeTag（找不到回 {seq:-1}）   |
| shareTagValueMap | shareTagId → string[] 值清單                                   |
| shareTagNameMap  | shareTagId → shareTagName 名稱對照表                           |

### 方法

| 名稱                         | 說明                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| changeDataset(seq)           | routeStore.patchQuery({ type: dataset, seq })                   |
| changeShareTag(seq)          | routeStore.patchQuery({ type: tag, seq })                       |
| checkVisibleByDataset(label) | 若 label.visibleDatasetNameList 有值，限制只在指定 dataset 顯示 |
| tagValueUpdate(event)        | 在 shareTagValueList 中切換加/刪標籤值並 reload                 |

---

## 四、FilterStore

### 職責

- 搜尋、標籤過濾、排序、分頁
- 計算 autoComplete 候選清單

### 搜尋機制

- 搜尋輸入：`routeStore.searchValue`（linkedSignal）
- 實際觸發：`queryParamsSearchValue`（URL 改變才觸發，避免 debounce 前的多餘計算）
- debounce 300ms 版本：`searchValueDebounced`（用於 autocomplete）
- 多關鍵字：逗號分隔，任一關鍵字命中任一 isSearchValue label 即算符合
- isSearchValue 的 seq 類型欄位排除在搜尋外

### 排序

| 情況             | 行為                                              |
| ---------------- | ------------------------------------------------- |
| `__random`       | 依 RANDOM_KEY（uint32）排序，每次進入頁面重新分配 |
| 一般 key         | `dynamicSort(key, asc)`                           |
| 無有效 sortValue | 不排序                                            |

seqKey 存在時：排序後重新對 seqKey 欄位計算序號（1-based）。

### Tag 過濾

1. useShareTag.seq === -1 時不過濾
2. 取 `shareTagValueMap[tag.shareTagId]` 的 Set
3. filter: `row[defaultKey]` 在 Set 中

### 分頁

| 名稱        | 說明                                               |
| ----------- | -------------------------------------------------- |
| pageSize    | themeOtherSetting.listPageSize，預設 30            |
| pages       | Math.ceil(filterData.length / pageSize) 個頁碼陣列 |
| viewData    | filterData.slice((page-1)*pageSize, page*pageSize) |
| currentPage | routeStore.page                                    |

分頁防護：若 page > pages.length（資料變少時），自動 setPage(1)。

### AutoComplete

- 篩選條件：isSearchValue=true 且 autoComplete=true 的 label
- stringArray 類型：展開陣列
- stringSplit 類型：依 label.splitBy 拆分
- 其他：直接轉字串
- 搜尋過濾：依 searchTokens 過濾候選清單

### filterData 計算順序

```
useData
  → filterBySearch()（依 queryParamsSearchValue）
  → tag 過濾
  → 排序
  → seqKey 重新編號
= filterData
  → slice(start, end)
= viewData
```

---

## 五、ResourceStore

### 職責

- 補充執行期資源，不影響過濾邏輯

### fileExistResource

- 條件：`themeOtherSetting.checkFileExist` 有值
- params：`viewData` 每筆 → `{ path: replaceValue(checkFileExist, row), name: row[defaultKey] }`
- API：POST /file/exist（返回 name→boolean 的 Map）
- viewData 變化時自動重新請求（每頁切換都查一次）

### customValueMap

- params：`{ headerId, valueList: viewData.map(row[defaultKey]) }`
- API：POST /theme/custom/value（返回 correspondDataValue → { byKey: customValue } 的巢狀 Map）
- valueList 為空時，ThemeService 前端直接回 {}
- 載入後補齊缺失鍵（missing keys → {}）

---

## 六、UIStateStore

### 職責

純 UI 暫態，不與後端互動

| signal             | 說明                                            |
| ------------------ | ----------------------------------------------- |
| hoveredIndex       | 滑鼠 hover 的列索引，-1 為無                    |
| fixedImagePath     | 放大圖片路徑                                    |
| refreshDate        | 手動刷新時間，用於圖片 cache busting            |
| quickRefreshResult | primeKey → 刷新後資料 Map（不存入 Dataset）     |
| ctrlPressed        | Ctrl 鍵狀態（imageList 中 Ctrl+Click 放大圖片） |

---

## 七、ListBaseViewStoreAdapter（Facade）

### 職責

- 組合所有 Store，向視圖提供統一入口
- 承載暫時無法拆分到子 Store 的複合邏輯
- 標注為過渡用途，未來視圖應直接注入各子 Store

### 不在子 Store 的複合方法

| 方法                          | 說明                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| randomSearch()                | 從 useData 中隨機挑一筆，設 searchValue 並觸發搜尋                                       |
| openEditData(data)            | 依 DATASET_NAME_KEY → findDataset → getGroupDataset → 開啟 EditGroupDatasetDataComponent |
| onRefresh()                   | refreshDataByNameList → datasetDataList.reload + refreshDate.set（手動全量刷新）         |
| selectMultipleValue()         | 透過 SelectTableService 多選自動完成值，回填 searchValue                                 |
| getTagValueLength(shareTagId) | 計算 tag 值中有多少筆與 useDataNameSet 有交集                                            |

---

## 八、視圖渲染差異

### ImageListViewComponent

| 功能          | 說明                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| 圖片來源      | themeImage.type = 'key'：data[imageKey] / 'url'：replaceValue(imageUrl, data) → proxy-image |
| quickRefresh  | 覆蓋單筆資料到 quickRefreshResult，不刷新整頁                                               |
| Ctrl+Click    | ctrlPressed=true 時點圖片 → fixedImagePath → FixedImageComponent 全螢幕顯示                 |
| 換頁後滾頂    | queryParamMap effect → scrollTo top                                                         |
| headerId 防護 | headerId 空 → navigate('')                                                                  |

### TableViewComponent

| 功能           | 說明                                                                  |
| -------------- | --------------------------------------------------------------------- |
| MatTable       | displayedColumns = checkVisibleByDataset 過濾後的 byKey + 'other'     |
| 行顏色         | rowColor[index % rowColor.length] 附加到 COLOR_KEY                    |
| MatSort 初始化 | effect：matSort 存在且無 active 時，依 sortKey + ascFlag 設定         |
| fileSize 合計  | fileSizeTotal(byKey)：全頁加總，type=fileSize 欄位用                  |
| MatPaginator   | 綁定 totalLength + pageSize + page，透過 onPageChange 更新 RouteStore |

### 共用元件

| 元件                      | 用途                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| CustomButtonsComponent    | 列級按鈕：openUrl/writeNote/copyValue/buttonIconBoolean/buttonIconFill/buttonInputUrl/apiConfig/deleteFile/moveTo/openFolder |
| TopCustomButtonsComponent | 頁首按鈕：openUrl/writeNote/apiConfig                                                                                        |
| ListItemValueComponent    | 依 ThemeLabel.type 渲染值（string / stringSplit / date / fileSize / stringArray / seq）                                      |
| ItemTagButtonsComponent   | 標籤值 toggle 按鈕（add/delete ShareTagValue）                                                                               |
| ImgContentComponent       | 圖片卡片內容                                                                                                                 |

---

## 九、QuickRefresh 流程

QuickRefresh 讓使用者在 imageList 視圖對單筆資料觸發 spider 爬取，結果覆蓋當頁顯示，不寫回 Dataset。

### 前提設定

`themeOtherSetting` 中需設定：

- `useSpider`：spider 名稱
- `quickRefreshType`：'params' 或 'url'
- `quickRefresh`：params 模式為逗號分隔的 key 清單；url 模式為資料中包含 url 的欄位名稱

### 執行流程

```
使用者點擊 quickRefresh 按鈕
  → 讀取 element[DATASET_NAME_KEY]、defaultKey、primeKey
  → 依 quickRefreshType 建立 params 或 url
  → datasetService.quickRefreshDataset({ byKey, primeKey, scrapyName, datasetName, url, params, quickRefreshType })
  → 成功後：quickRefreshResult[primeKey] = res
  → getData(data) 在渲染時 merge quickRefreshResult 覆蓋原始資料
```

### 注意

- quickRefreshResult 為 UIStateStore 的 signal，不持久化
- 頁面刷新或換頁後舊結果仍存在 quickRefreshResult 中，需重新呼叫才能更新

---

## 十、CustomButtons 行為細節

### 列級按鈕（CustomButtonsComponent）

| type              | 行為                                                          |
| ----------------- | ------------------------------------------------------------- |
| openUrl           | window.open(replaceValue(openUrl, data), target)              |
| writeNote         | 開啟 ThemeNoteComponent 對話框，讀寫 customValue              |
| copyValue         | 複製 replaceValue(copyValue, data) 到剪貼板                   |
| buttonIconBoolean | toggle true/false，圖示依 buttonIconTrue/buttonIconFalse 切換 |
| buttonIconFill    | toggle true/false，圖示依 fill 狀態切換                       |
| buttonInputUrl    | 開啟 ButtonInputUrlComponent 對話框輸入 URL                   |
| apiConfig         | apiConfigService.callSingleApi(apiConfig, data)               |
| deleteFile        | fileService.deleteFile                                        |
| moveTo            | fileService.moveFile，fileExistSync 本地更新                  |
| openFolder        | window.open(openFolder)                                       |

customValue 儲存機制：

1. 點擊後呼叫 `themeService.updateCustomValue(req)`
2. 成功後直接更新 `customValueMap()[correspondDataValue][byKey]`（前端本地同步）

### 頁首按鈕（TopCustomButtonsComponent）

| type      | 行為                                            |
| --------- | ----------------------------------------------- |
| openUrl   | window.open(openUrl, '\_blank')                 |
| writeNote | 開啟 ThemeNoteComponent，讀寫頁首級 customValue |
| apiConfig | apiConfigService.callSingleApi(apiConfig, null) |

---

## 十一、與 Theme / Dataset 的執行關係

```
Theme
  ├── ThemeHeader (headerId)
  └── ThemeItems
        ├── LABEL     → HeaderStore.visibleLabelList → Table columns / 搜尋欄位 / 排序欄位
        ├── DATASET   → DataStore.datasetDataListReq → 資料來源
        ├── TAG       → DataStore.shareTagValueList → 標籤過濾
        ├── CUSTOM    → CustomButtonsComponent 列級按鈕
        ├── TOPCUSTOM → TopCustomButtonsComponent 頁首按鈕
        ├── OTHERSETTING → FilterStore.pageSize / ResourceStore.fileExistReq / QuickRefresh
        └── IMAGE     → ImageListViewComponent.getImageUrl()

Dataset
  └── DatasetData[] → DataStore.useData → FilterStore.filterData → ResourceStore params → View
```

Theme 任何一個 Item 改變，HeaderStore 會觸發 rxResource reload，
接著下游的 DataStore → FilterStore → ResourceStore 全部跟著重算。

---

## 已知限制與過渡注意事項

1. **ListBaseViewStoreAdapter** 是過渡 Facade，未來應由各元件直接注入子 Store。
2. **quickRefreshResult** 不持久化，快速刷新後換頁再回來需重新觸發。
3. **ResourceStore.fileExistResource** 每次 viewData 改變都發一次請求（每頁切換），若筆數多且 checkFileExist 路徑複雜，注意效能。
4. **customValueMap** valueList 為空時直接回 {}，不發 API（ThemeService 已有前端 guard）。
5. **checkVisibleByDataset** 僅做顯示控制，資料本身仍在 useData 中，不影響搜尋結果。
