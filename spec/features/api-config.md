# Api Config（API 設定）

## 路由

| 路徑             | 頁面                   | 說明                  |
| ---------------- | ---------------------- | --------------------- |
| /api-config-list | ApiConfigListComponent | 管理可重用的 API 設定 |

---

## 資料模型

### ApiConfig

| 欄位           | 型別                         | 說明                                |
| -------------- | ---------------------------- | ----------------------------------- |
| apiName        | string                       | 主鍵，API 設定名稱                  |
| httpMethod     | get \| post \| delete \| put | HTTP 方法                           |
| endpointUrl    | string                       | 目標 URL，可含變數                  |
| requestBody    | string                       | 請求本文（JSON 字串）               |
| httpParams     | string                       | 參數設定（目前主要作為設定欄位）    |
| httpHeaders    | string                       | Header 設定（目前主要作為設定欄位） |
| successMessage | string                       | 成功訊息                            |
| updatedTime    | string                       | 更新時間                            |

### HttpMethodType

- get
- post
- delete
- put

---

## Service API 合約

### ApiConfigService

| Method | URL                       | Request            | Response    | 說明               |
| ------ | ------------------------- | ------------------ | ----------- | ------------------ |
| GET    | /api-config/all           | —                  | ApiConfig[] | 取得全部設定       |
| POST   | /api-config/update        | Partial<ApiConfig> | void        | 新增/更新設定      |
| POST   | /api-config/delete        | Partial<ApiConfig> | void        | 刪除設定           |
| POST   | /api-config/all/name      | Partial<string[]>  | ApiConfig[] | 依名稱批次取得設定 |
| GET    | /api-config/name?name=... | —                  | ApiConfig   | 依名稱取單筆       |

### 動態呼叫邏輯（執行 API 設定）

- 依 httpMethod 對 endpointUrl 發送 GET/POST/DELETE/PUT
- POST/PUT 會先做模板替換，再 JSON.parse 成 request body
- 成功後顯示 successMessage

---

## 業務規則

1. 新增時 apiName 不可重複。
2. apiName、endpointUrl 必填。
3. 當方法為 post/put 時，requestBody 必須是合法 JSON。
4. 刪除前需使用確認對話框。
5. 一次可對多筆資料執行設定 API 並彙總成功訊息。

---

## 與其他功能關聯

- 被 Theme 的 custom/top-custom 按鈕使用。
- 被 Dataset 的 GroupDatasetApi 設定使用。
- 被 Data View 的自訂按鈕執行流程使用。

---

## 已知限制

- httpParams、httpHeaders 目前主要存在於模型與編輯 UI，動態呼叫流程中是否完整套用需再確認。
