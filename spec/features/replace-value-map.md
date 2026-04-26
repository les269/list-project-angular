# Replace Value Map（替換對照表）

## 路由

| 路徑               | 頁面                     | 說明                              |
| ------------------ | ------------------------ | --------------------------------- |
| /replace-value-map | ReplaceValueMapComponent | 管理 match -> replaceValue 對照表 |

---

## 資料模型

### ReplaceValueMap

| 欄位        | 型別                   | 說明               |
| ----------- | ---------------------- | ------------------ |
| name        | string                 | 對照表名稱（主鍵） |
| map         | Record<string, string> | 替換字典           |
| createdTime | string                 | 建立時間           |
| updatedTime | string                 | 更新時間           |

### ReplaceValueList（UI 編輯用）

| 欄位         | 型別   | 說明     |
| ------------ | ------ | -------- |
| match        | string | 原始值   |
| replaceValue | string | 替換後值 |

---

## Service API 合約

### ReplaceValueMapService

| Method | URL                                | Request         | Response          | 說明         |
| ------ | ---------------------------------- | --------------- | ----------------- | ------------ |
| GET    | /replace-value-map/name-list       | —               | ReplaceValueMap[] | 取得名稱清單 |
| GET    | /replace-value-map/get?name=...    | —               | ReplaceValueMap   | 取得單筆     |
| GET    | /replace-value-map/exist?name=...  | —               | boolean           | 名稱是否存在 |
| POST   | /replace-value-map/update          | ReplaceValueMap | void              | 新增/更新    |
| DELETE | /replace-value-map/delete?name=... | —               | void              | 刪除         |

---

## 業務規則

1. 搜尋、更新、刪除前，name 不可空白。
2. UI 以表格編輯 match/replaceValue，儲存時轉回 map 字典。
3. 刪除流程為：exist 檢查 -> 確認對話框 -> delete。
4. 支援 JSON 匯入（object entries -> 表格）與匯出（表格 -> JSON）。

---

## 與其他功能關聯

- 被 Dataset 的 GroupDatasetField.replaceValueMapName 使用。
- 被 Spider 的 pipeline 替換步驟使用。

---

## 已知限制

- JSON 匯入失敗主要由 console 記錄，使用者提示可再補強。
