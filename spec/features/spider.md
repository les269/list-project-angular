# Spider（新式爬蟲）

> 狀態：草稿規格（功能開發中）
>
> 這份文件以目前可讀到的程式碼為準，對未完成功能會標記 unknown 或 TODO。

## 路由

| 路徑                   | 頁面                | 說明              |
| ---------------------- | ------------------- | ----------------- |
| /spider-list           | SpiderListComponent | SpiderConfig 清單 |
| /spider-edit           | SpiderEditComponent | 新增 SpiderConfig |
| /spider-edit/:spiderId | SpiderEditComponent | 編輯 SpiderConfig |

---

## 資料模型（核心）

### SpiderConfig

| 欄位         | 型別                                                   | 說明              |
| ------------ | ------------------------------------------------------ | ----------------- |
| spiderId     | string                                                 | 主鍵              |
| description  | string                                                 | 描述              |
| primeKeySize | number                                                 | 主鍵數量          |
| isUrlBased   | boolean                                                | 是否直接 URL 驅動 |
| testData     | { pkArray: string[]; url: string; resultJson: string } | 測試資料          |

### SpiderMapping

| 欄位           | 型別   | 說明        |
| -------------- | ------ | ----------- |
| spiderId       | string | 所屬 spider |
| executionOrder | number | 執行順序    |
| spiderItemId   | string | 對應項目    |

### SpiderItem / SpiderItemSetting

- spiderItemId, description
- itemSetting.url
- itemSetting.urlType（BY_PARAMS / BY_PRIME_KEY）
- itemSetting.mode（SELECT / JSON_PATH）
- itemSetting.extractionRuleList
- itemSetting.skipWhenUsingUrl
- itemSetting.useCookie

### ExtractionRule

- seq, key
- selector / jsonPath
- condition, conditionKey, conditionValue
- pipelines

### ValuePipeline

- type（EXTRACT_ATTR / EXTRACT_OWN_TEXT / REPLACE_REGULAR / SPLIT_TEXT / CONVERT_TO_ARRAY / FIRST_VALUE / COMBINE_TO_STRING / COMBINE_BY_KEY / USE_REPLACE_VALUE_MAP）
- enabled
- 依 type 使用對應欄位（attributeName/pattern/replacement/separator/...）

### Cookie 相關

- CookieListTO
- CookieListMapTO

---

## Service API 合約（摘要）

### SpiderConfigService

| Method | URL                                | Request      | Response       |
| ------ | ---------------------------------- | ------------ | -------------- |
| GET    | /spider-config/all                 | —            | SpiderConfig[] |
| GET    | /spider-config?spiderId=...        | —            | SpiderConfig   |
| POST   | /spider-config/update              | SpiderConfig | void           |
| DELETE | /spider-config/delete?spiderId=... | —            | void           |
| GET    | /spider-config/in-use?spiderId=... | —            | boolean        |

### SpiderMappingService

- GET /spider-mapping/all
- GET /spider-mapping/by-spider-id
- GET /spider-mapping
- POST /spider-mapping/update
- POST /spider-mapping/update-list
- DELETE /spider-mapping/delete
- DELETE /spider-mapping/delete-by-spider-id
- GET /spider-mapping/in-use-by-spider-item-id

### SpiderItemService

- GET /spider-item/all
- GET /spider-item
- POST /spider-item/update
- DELETE /spider-item/delete
- GET /spider-item/in-use
- POST /spider-item/by-id-list
- GET /spider-item/by-spider-id

### CookieListService

- GET /cookie-list/by-ref-id-and-type
- GET /cookie-list/all
- GET /cookie-list
- POST /cookie-list/update
- DELETE /cookie-list/delete

### CookieListMapService

- GET /cookie-list/map/in-use
- GET /cookie-list/map/by-id-and-type
- GET /cookie-list/map/by-ref-id
- GET /cookie-list/map/by-type
- POST /cookie-list/map/update
- DELETE /cookie-list/map/delete
- GET /cookie-list/map/cookie-in-use

---

## 業務規則（目前可確認）

1. spider-edit 以路由參數決定 create/edit 模式。
2. edit 模式鎖 spiderId，不可任意修改主鍵。
3. isUrlBased 會影響 primeKeySize 驗證：
   - URL-based 可為 0
   - 非 URL-based 至少 1
4. testData.pkArrayJson 必須是合法 JSON 且為 string[]。
5. 新增 item tab 前，需先儲存 spider 主體。
6. mapping tab 支援拖曳排序，拖曳後重算 executionOrder 並呼叫 update-list。
7. 刪除 spider item 前會檢查是否 in-use，使用中不可刪。

---

## 與其他功能關聯

- 依賴 Replace Value Map（pipeline 可套用替換表）。
- 透過 CookieList/CookieListMap 管理需登入站點的爬取資訊。
- 與 Dataset 有資料來源設定上的耦合。

---

## 未完成與不確定區塊（重要）

1. SpiderItem 中測試解析功能（HTML/JSON）仍有空實作。
2. 測試解析 API 的 request/response 完整 schema 尚不明確（unknown）。
3. 部分型別/匯入仍可見過渡痕跡，表示該 feature 持續演進中。

---

## 建議使用方式（給 AI）

- 目前可把此規格當成「基線」：
  - 已定義模型、路由、主要 API
  - 未完成功能用 TODO 區標記
- 每次補完一段 Spider 功能時，優先更新本文件的「未完成與不確定區塊」。
