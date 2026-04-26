# Setting（系統設定）

## 路由

| 路徑            | 頁面                     | 說明                   |
| --------------- | ------------------------ | ---------------------- |
| `/setting`      | SettingDatabaseComponent | 資料庫設定（預設子頁） |
| `/setting/disk` | DiskManagementComponent  | 硬碟管理               |

父頁面 `SettingComponent` 僅作為 layout 容器（側邊欄 + router-outlet），無業務邏輯。

---

## 子功能一：Database Config（資料庫設定）

### 用途

管理可切換使用的多組資料庫設定，支援 SQLite 和 PostgreSQL。

### 資料模型

#### `DatabaseConfig`

| 欄位                   | 型別                         | 說明                                     |
| ---------------------- | ---------------------------- | ---------------------------------------- |
| `configId`             | string                       | 主鍵，唯一識別，不可修改                 |
| `configName`           | string                       | 顯示名稱                                 |
| `databaseType`         | `'sqlite'` \| `'postgresql'` | 資料庫類型                               |
| `sqliteFilePath`       | string                       | SQLite 時：檔案路徑（從 `jdbcUrl` 解析） |
| `host`                 | string                       | PostgreSQL 時：主機位址                  |
| `port`                 | number                       | PostgreSQL 時：連接埠                    |
| `databaseName`         | string                       | PostgreSQL 時：資料庫名稱                |
| `username`             | string                       | PostgreSQL 時：帳號                      |
| `password`             | string                       | PostgreSQL 時：密碼                      |
| `jdbcUrl`              | string                       | JDBC 連線字串                            |
| `driverClassName`      | string                       | JDBC Driver 類名                         |
| `hibernateDialect`     | string                       | Hibernate Dialect                        |
| `additionalProperties` | string                       | 額外 JPA 屬性                            |
| `enabled`              | number                       | 是否啟用（0/1）                          |
| `description`          | string                       | 備註說明                                 |
| `createdTime`          | string                       | 建立時間                                 |
| `updatedTime`          | string                       | 更新時間                                 |

#### `Setting`（通用設定 key-value）

| 欄位          | 型別    | 說明     |
| ------------- | ------- | -------- |
| `name`        | string  | 設定 key |
| `value`       | string  | 設定值   |
| `description` | string  | 說明     |
| `enabled`     | boolean | 是否啟用 |
| `updatedTime` | string  | 更新時間 |

#### `TestConnectionResult`

| 欄位      | 型別    | 說明             |
| --------- | ------- | ---------------- |
| `success` | boolean | 連線是否成功     |
| `message` | string  | 失敗時的錯誤訊息 |

### 重要常數（`src/app/shared/util/global.ts`）

| 常數                              | 值                           | 說明                               |
| --------------------------------- | ---------------------------- | ---------------------------------- |
| `CURRENT_DYNAMIC_DB_SETTING_NAME` | `'current_dynamic_database'` | 記錄目前使用中資料庫的 Setting key |
| `DEFAULT_DYNAMIC_DB_KEY`          | `'default'`                  | 預設資料庫的 configId，不可刪除    |

### API 端點（`DatabaseConfigService`）

| Method | URL                                | Request            | Response               | 說明               |
| ------ | ---------------------------------- | ------------------ | ---------------------- | ------------------ |
| GET    | `/database-config/all`             | —                  | `DatabaseConfig[]`     | 取得所有資料庫設定 |
| POST   | `/database-config/test-connection` | `DatabaseConfig`   | `TestConnectionResult` | 測試連線           |
| POST   | `/database-config/save`            | `DatabaseConfig`   | `void`                 | 新增或更新設定     |
| DELETE | `/database-config/delete`          | params: `configId` | `void`                 | 刪除設定           |

### API 端點（`SettingService`，Setting 功能）

| Method | URL                       | Request        | Response  | 說明                |
| ------ | ------------------------- | -------------- | --------- | ------------------- |
| GET    | `/setting/get-by-name`    | params: `name` | `Setting` | 依 key 取得單筆設定 |
| POST   | `/setting/changeDatabase` | `Setting`      | `void`    | 切換使用中的資料庫  |

### 業務規則

1. **切換資料庫前必須先驗證連線**：`changeCurrent()` 會先呼叫 `testConnection`，連線失敗則不執行切換。
2. **預設資料庫不可刪除**：`configId === DEFAULT_DYNAMIC_DB_KEY`（值為 `'default'`）的設定不顯示刪除按鈕。
3. **SQLite 的 `sqliteFilePath` 由 `jdbcUrl` 解析**：送出前執行 `jdbcUrl.replace(/^jdbc:sqlite:/, '').trim().replace(/\\/g, '/')`。
4. **`configId` 於新增後不可修改**（表單驗證禁止）：`configIdIsDefaultValidator` 檢查 configId 不能使用 `DEFAULT_DYNAMIC_DB_KEY`。
5. **SQLite 必填 `sqliteFilePath`**：`sqlitePathRequiredValidator` 在 `databaseType === 'sqlite'` 時驗證此欄位不可空白。
6. **目前使用中的資料庫不顯示「切換」按鈕**：`configId === currentSetting().value` 時隱藏。

---

## 子功能二：Disk Management（硬碟管理）

### 用途

監控指定磁碟代號的空間使用狀況（僅支援 Windows 磁碟代號 A–Z）。

### 資料模型

#### `Disk`

| 欄位          | 型別    | 說明                                             |
| ------------- | ------- | ------------------------------------------------ |
| `disk`        | string  | 磁碟代號（如 `C`、`D`）                          |
| `totalSpace`  | number  | 總容量（bytes）                                  |
| `freeSpace`   | number  | 剩餘空間（bytes）                                |
| `usableSpace` | number  | 可用空間（bytes）                                |
| `updateDate`  | string  | 資料更新時間                                     |
| `usedSpace`   | number? | 已使用空間（前端計算：`totalSpace - freeSpace`） |

### API 端點（`DiskService`）

| Method | URL             | Request              | Response | 說明                 |
| ------ | --------------- | -------------------- | -------- | -------------------- |
| GET    | `/disk/all`     | —                    | `Disk[]` | 取得所有監控磁碟資料 |
| POST   | `/disk/add`     | `string`（磁碟代號） | `void`   | 新增監控磁碟         |
| GET    | `/disk/refresh` | —                    | `void`   | 重新整理所有磁碟資料 |
| POST   | `/disk/delete`  | `string`（磁碟代號） | `void`   | 刪除監控磁碟         |

### 業務規則

1. **磁碟代號限 A–Z 單一字母**：新增對話框以下拉選單提供 A–Z 共 26 個選項，預設選 `A`。
2. **`usedSpace` 為前端計算值**：`totalSpace - freeSpace`（後端不回傳此欄位）。
3. **表格底部顯示總計列**：`totalSpace`、`freeSpace`、`usedSpace` 三欄加總顯示於 footer row，使用 `computed()` 訊號計算。
4. **容量格式化**：顯示時以 `formatBytes()` 轉換為人類可讀格式（B / KB / MB / GB / TB，取到小數點後兩位）。
5. **刪除前需確認**：開啟 `MessageBoxService` 確認對話框，確認後才呼叫刪除 API。
