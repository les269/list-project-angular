# 自定義清單管理系統 — 業務邏輯總覽

## 系統簡介

本系統是一個**自定義清單管理平台**，整合後端 Spring Boot 服務，能從多種資料來源（網路爬蟲、API 呼叫、手動輸入）收集資料，組織成資料集，最後以可高度設定的清單或表格形式展示給使用者。

---

## 整體架構

```
資料獲取層                資料組織層              展示層
────────────────          ───────────────         ────────────────
Spider（新式爬蟲）  ──→   Group Dataset      ──→  Dataset（資料集）
Scrapy（舊式爬蟲）  ──→   （群組資料容器）        ↓
API Config         ──→                            Theme（主題設定）
手動輸入            ──→                            ↓
                                                  Data View（瀏覽頁面）
```

---

## 功能模組說明

### 1. Theme（主題 / 清單）

系統的**核心配置單元**，每個 Theme 定義一個可瀏覽的清單頁面。

- **呈現類型**：`imageList`（圖片網格）或 `table`（資料表格）
- **圖片來源**：可從資料欄位取值，或使用 URL 範本（如 `http://host/img/${id}.jpg`）
- **欄位定義（ThemeLabel）**：設定每個欄位的顯示方式（文字、陣列、日期、檔案大小等），以及是否支援搜尋、排序、複製
- **資料集綁定（ThemeDataset）**：可綁定多個資料集，使用者可在頁面切換
- **標籤過濾（ThemeTag）**：引用共享標籤，提供側邊欄過濾介面
- **行操作按鈕（ThemeCustom）**：每筆資料可配置自訂按鈕，支援開啟 URL、呼叫 API、複製值、切換狀態、移動檔案等操作
- **頂部按鈕（ThemeTopCustom）**：清單頂部的全域批次操作按鈕
- **其他設定**：列顏色循環、每頁筆數、本地檔案存在檢查、快速刷新

---

### 2. Data View（資料瀏覽引擎）

負責渲染 Theme 設定的**實際展示頁面**，採用 Angular Signals 進行狀態管理。

| Store           | 職責                                                       |
| --------------- | ---------------------------------------------------------- |
| `HeaderStore`   | 載入 ThemeHeader 與 ThemeItems                             |
| `DataStore`     | 批次載入所有相關 DatasetData，計算當前顯示資料             |
| `FilterStore`   | 搜尋過濾（多關鍵字以逗號分隔）、排序（含隨機）、分頁       |
| `RouteStore`    | 將搜尋、排序、分頁、資料集選擇等狀態同步至 URL QueryParams |
| `ResourceStore` | 批次查詢本地檔案存在狀態，載入自定義備註（Note）           |

**瀏覽頁面路由**：

- 圖片清單：`/imageList/:name/:version`
- 資料表格：`/table/:name/:version`

---

### 3. Dataset（資料集）

資料的**直接容器**，分為兩層結構：

#### Group Dataset（群組資料集）

- 群組是多個 Dataset 共用的資料來源
- 每筆資料由 `primeValue`（主鍵）+ `json`（資料本體）組成
- 資料可透過**爬蟲、API 或手動輸入**新增
- 支援圖片自動下載至指定資料夾

#### Dataset（資料集）

- 從 Group Dataset 中篩選資料的規則，`type` 決定篩選方式：

| type         | 說明                            |
| ------------ | ------------------------------- |
| `file`       | 按檔案名稱過濾群組資料          |
| `folder`     | 按資料夾名稱過濾                |
| `all`        | 取群組全部資料                  |
| `text`       | 純文字/CSV 輸入（每行逗號分隔） |
| `pagination` | 分頁爬取模式                    |

- 可設定固定欄位（路徑、檔名、固定字串、檔案大小）

---

### 4. Spider（新式爬蟲）

以**結構化規則 + Pipeline 處理鏈**為核心的進階爬蟲系統。

- **SpiderConfig**：爬蟲主設定（主鍵數量、是否 URL 型爬蟲）
- **SpiderItem**：可複用的提取規則模組，支援 CSS Selector 和 JsonPath 兩種模式
- **ExtractionRule（提取規則）**：從頁面提取欄位並套用條件執行（支援 8 種條件：ALWAYS、IF_KEY_EMPTY、CONTAINS、MATCHES 等）
- **ValuePipeline（後處理步驟鏈）**：

| 步驟類型                | 說明                           |
| ----------------------- | ------------------------------ |
| `EXTRACT_ATTR`          | 提取 HTML 屬性（如 href、src） |
| `EXTRACT_OWN_TEXT`      | 只取父元素自身文字             |
| `REPLACE_REGULAR`       | 正則替換                       |
| `SPLIT_TEXT`            | 分割字串                       |
| `CONVERT_TO_ARRAY`      | 強制轉為陣列                   |
| `FIRST_VALUE`           | 只保留第一筆                   |
| `COMBINE_TO_STRING`     | 陣列合併為字串（模板語法）     |
| `COMBINE_BY_KEY`        | 用已有 key 值合併字串          |
| `USE_REPLACE_VALUE_MAP` | 套用替換對照表                 |

- **SpiderMapping**：以執行順序（`executionOrder`）將多個 SpiderItem 綁定至同一個 SpiderConfig，形成處理流水線

---

### 5. Scrapy（舊式爬蟲）

輕量型爬蟲，主要供 Group Dataset 使用，支援 CSS Selector、轉址、分頁爬取。

- **ScrapyConfig**：爬蟲設定，可設定多步驟（redirect 取轉址 URL → scrapyData 提取資料）
- **CssSelect**：CSS 選擇器規則，支援屬性提取、陣列轉換、正則替換、替換對照表
- **ScrapyPagination（分頁爬蟲）**：從起始 URL 自動翻頁，支援增量更新控制（`lastUpdateDate` + `updateInterval`），可使用 Spring EL 表達式動態產生 URL 參數

---

### 6. API Config（API 設定）

儲存可重複使用的 HTTP 請求配置，用於：

1. **Group Dataset** 作為資料來源
2. **Theme 行操作按鈕** 點擊時呼叫 API

設定項目包含：HTTP Method、Endpoint URL、Request Body、Headers、成功提示訊息，URL 和 Body 均支援 `${key}` 變數替換。

---

### 7. Replace Value Map（替換對照表）

以名稱索引的 `{ match → replaceValue }` 映射表，用於：

1. Spider 的 `USE_REPLACE_VALUE_MAP` Pipeline 步驟
2. Group Dataset Field 的 `replaceValueMapName` 欄位
3. Scrapy CssSelect 的 `replaceValueMapName`

---

### 8. Share Tag（共享標籤）

全域定義的標籤分類系統：

- **ShareTag**：標籤分類（如「狀態」、「類型」）
- **ShareTagValue**：標籤內的值（如「完結」、「連載中」）
- Theme 透過 `ThemeTag.shareTagId` 引用，在 Data View 頁面提供標籤過濾側邊欄

---

### 9. Cookie 管理

- **CookieList**：命名的 Cookie 清單（`cookieId` 為主鍵）
- **CookieListMap**：將 Cookie 清單綁定至 Spider 或 API Config（`SPIDER` / `API` 兩種類型）
- 用於需要登入的爬蟲目標網站

---

### 10. Setting（系統設定）

| 子頁                | 功能                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| **Database Config** | 支援 SQLite 和 PostgreSQL，可配置多個資料庫並切換使用中的資料庫，提供連線測試 |
| **Disk Management** | 監控各硬碟的總容量、剩餘空間，支援新增/刪除監控項目                           |

---

## 功能相依關係

```
ReplaceValueMap ◄──── Spider.ValuePipeline
                ◄──── Scrapy.CssSelect
                ◄──── GroupDataset.FieldList

CookieList ──────────► Spider / ApiConfig

Scrapy ───────────────► GroupDataset（爬蟲資料來源）
Spider ───────────────► (進階爬蟲，獨立使用)
ApiConfig ────────────► GroupDataset（API 資料來源）
                  ────► Theme.ThemeCustom（行操作按鈕）
                  ────► Theme.ThemeTopCustom（頂部按鈕）

GroupDataset ─────────► Dataset（groupName 關聯）
Dataset ──────────────► Theme.ThemeDataset（datasetList 關聯）
ShareTag ─────────────► Theme.ThemeTag（shareTagId 關聯）
Theme ────────────────► DataView（name + version 路由參數）
```

---

## 標準使用流程

| 階段               | 功能                         | 備註               |
| ------------------ | ---------------------------- | ------------------ |
| 資料獲取（可選）   | Scrapy / Spider / API Config | 若手動輸入可跳過   |
| 建立對照表（可選） | Replace Value Map            | 爬蟲文字替換用     |
| 資料組織           | Group Dataset → Dataset      | 必要步驟           |
| 清單生成           | Theme                        | 必要步驟           |
| 標籤管理（可選）   | Share Tag                    | 需要過濾功能時使用 |

完成配置後，訪問以下路由即可瀏覽對應清單，支援**搜尋、標籤過濾、排序、分頁、自定義操作按鈕**等完整互動功能：

- 圖片清單：`/imageList/:name/:version`
- 資料表格：`/table/:name/:version`
