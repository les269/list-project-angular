# API 請求設定整合狀態

## 已確認的方向

- 功能名稱為「API 請求設定」，前端模型為 `ApiRequestConfig`。
- 主資料使用 `apiId` 作為 PK，另有 `description`、`config`、`createdTime`、`updatedTime`。建立與更新時間由後端維護，前端不產生或覆寫。
- `config` 保留 `httpMethod`、`endpointUrl`、`requestBody`，並加入 Params、Body 格式、timeout、啟用狀態與成功訊息。編輯畫面以 `Params`、`Body`、`Authorization` 分頁呈現。
- HTTP Method 沿用舊版的 `get`、`post`、`delete`、`put`。URL 必填；原始 Body 維持字串，不自動解析、格式化或替換 JSONPath。舊三欄位設定仍可載入，缺少的新設定由前端補上預設值。
- Body 的 JSON 格式化按鈕僅在使用者操作時處理有效 JSON；格式不符時保留原文並提示，不阻擋字串儲存。前端仍保留其他已載入的設定欄位。
- Cookie 與 Header 沿用 Spider 的共用清單及 Map，`refId` 使用 `apiId`，`type` 使用 `API`。
- 請求由後端執行，前端不直接存取設定中的目標 URL。
- Theme 與 GroupDataset 的 API 引用使用 `apiId`，不保存整份請求設定。既有操作類型代碼 `apiConfig` 保留，避免一併變更不相關的 enum 契約。

## OpenAPI 與待確認事項

2026-11-10 重新核對專案指定 [OpenAPI](http://192.168.0.193:8081/list-project-backend/v3/api-docs)，主資料已更名為 `ApiRequestConfigTO`，包含 `apiId`、`description`、巢狀 `config`、`createdTime` 與 `updatedTime`，不再包含 `date`。兩個時間欄位皆為 `type: string`、`format: date-time`；前端讀取時轉為 `Date`，儲存設定時不傳送這兩個欄位，缺少時間時清單顯示「—」。`ApiRequestSettings` 的欄位與列舉已與前端對應，管理端點仍使用 `/api/api-config`。新增的執行端點為 `POST /api/api-config/singalCallApi`，輸入使用 `SingalCallApiReqTO` 的 `apiId` 與 `json`，回應 Body 定義為物件陣列。

仍需由後端實作或契約確認：

1. Body 格式對應的 Content-Type、共用 Header 的覆蓋優先順序。
2. 缺少設定、停用或執行失敗時的 HTTP 狀態與回應語意，以及是否提供目標 API 的 Headers；目前執行端點的回應 schema 未包含目標 Headers。
3. API 刪除時清除兩種 Map 的責任，以及 Theme、GroupDataset 引用的檢查／清理規則。
4. 新增 API 與重複 ID 的區分方式。前端會檢查已載入的 ID，但無法代替後端的唯一性保護。

## 目前前端行為

- 管理服務使用 `/api-config/all`、`/api-config/update`、`/api-config/delete` 路徑，由共用 API 位址補上 `/api`；主要設定結構與時間欄位已對上 OpenAPI。
- 讀取到舊資料結構會顯示載入錯誤，避免把舊資料誤當成新設定編輯。沒有自動遷移或刪除舊資料。
- 清單執行畫面已串接 `singalCallApi`；Theme 與 GroupDataset 相關的其他執行入口仍待整合。
- 主清單提供新增、編輯、搜尋、Cookie／Header 綁定及刪除操作。
- 清單的編輯按鈕前加入執行入口，開啟參數 JSON Editor 與結果畫面；Headers 位於左側、Body 位於右側，執行按鈕位於左下角。`CallApiRequest` 與 `CallApiResponse` 對應傳輸契約，`CallApiResult` 僅用於畫面顯示。
- 舊前端路由 `/api-config-list` 轉址至 `/api-request-config-list`。
- 目前已核對 OpenAPI 契約，尚未進行實際 CRUD／執行流程驗收，不能以單元測試或前端建置通過視為前後端驗收完成。

## 清單執行畫面

- 參數預設為 `{}`，只接受有效的 JSON 物件；前端直接以解析後的物件傳入 `json`，不替換 JSONPath，也不直接呼叫設定中的目標 URL。
- 服務透過 `observe: 'response'` 取得執行端點的 HTTP 狀態、瀏覽器可讀取的 Headers 與 Body；左側 Headers 不代表目標 API 的 Headers。Body 物件陣列格式化後以唯讀 Editor 顯示。
- 執行期間鎖定參數與 dialog 關閉操作，阻擋重複提交；回應或錯誤後解除鎖定。API 停用時無法執行。
- 執行失敗時顯示錯誤回應的 Headers 與 Body，保留輸入參數供重試；每次執行前清除前次結果，不自動重試。文字或 HTML 錯誤內容以純文字顯示。

## Params 與 URL

- Params 與 Body Form 使用 `generic-table`，支援新增、刪除與拖曳排序；`seq` 僅供編輯時顯示，儲存時移除。Params 排序會同步更新 URL 的參數順序。
- `httpParams` 是逐列的 `name`、`value`、`enabled` 設定，可保留重複 Key、空值及停用列；`hasEquals` 用來保留 `?flag` 與 `?flag=` 的差異。
- 編輯 URL 會重新讀取啟用參數並保留已停用列；編輯表格或勾選啟用狀態會更新 URL。
- `endpointUrl` 已包含啟用的 Query Params，後端不可再把 `httpParams` 重複附加到 URL。停用列僅保留設定，不執行。
- 表格更新 URL 時，會編碼一般 Query 字元以保留參數結構；`{{…}}` 與 `${…}` 標記保留原文，不解析其中的 JSONPath。

## Body 與執行控制

- `bodyType` 支援 `none`、`form-data`、`x-www-form-urlencoded`、`text`、`javascript`、`json`、`html`、`xml`。
- `none` 不傳送 Body；兩種 Form 格式使用 `bodyFormFields` 表格，其餘格式使用 `requestBody` 字串與對應語言的 Editor。
- `bodyFormFields` 的文字欄位使用 `name`、`value`、`enabled`，後端只處理啟用且非空白草稿的列。form-data 目前未加入檔案上傳。
- 原始 Body 與 Form 欄位分別保留，切換格式或分頁不清空內容；後端只使用目前 `bodyType` 對應的內容。
- `timeoutMs` 預設為 `10000`（10 秒），前端接受大於 0 的整數毫秒；實際逾時控制由後端執行。
- `enabled` 預設為 `true`，後端執行時需檢查停用狀態。`successMessage` 預設為空字串，供執行成功後使用。
- 新增設定預設 `bodyType=none`；舊設定已有非空白 Body 時，以 JSON Editor 顯示原文，不轉換內容。

## Authorization

- Authorization 分頁沿用現有 Cookie／Header 共用清單，不另存一份認證內容。
- 新 API 須先儲存才能建立綁定；已儲存 API 的綁定使用原始 `apiId` 與 `type=API`。
- 共用 Cookie／Header 的編輯與綁定會立即儲存，不受主設定對話框的取消操作回復。
