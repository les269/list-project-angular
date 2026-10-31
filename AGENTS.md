# 專案協作指引

## 語言

- 回覆及新增／修改的註解一律使用繁體中文；識別字、Log、錯誤訊息及技術名詞維持英文。

## 資料來源與閱讀順序

- 先讀本檔，再依任務查看 `package.json`、`angular.json` 與相關程式碼、測試。
- 不參考 `public/md/`；`README.md` 已標示過時，不作為目前功能或架構的依據。
- `spec/` 為其他 AI 產生、尚未全面驗證的輔助文件，不是已確認的需求或驗收標準。僅在需要時讀取相關篇章，並核對實作與測試。
- 使用者明確需求優先；現有行為以程式碼與測試交叉確認，不將現有實作自動視為正確的業務規則。遇到影響實作的業務歧義時提出確認。
- 不預讀整個專案、全部 spec、skill references 或完整 lockfile；依任務搜尋並讀取必要範圍。忽略建置產物、快取與依賴目錄。

## 專案定位與入口

- 本專案是自定義清單管理系統的 Angular 前端，串接獨立後端服務。
- `src/app/app.routes.ts`：路由；`src/app/app.config.ts`：應用程式 providers。
- `src/app/core/`：共用服務、元件、layout、interceptors 與 tokens。
- `src/app/shared/`：共用工具；`src/app/features/`：功能模組。
- 主要功能為 `theme`、`data-view`、`dataset`、`spider`、`api-config`、`replace-value-map`、`setting`。
- `src/environments/`：開發與 production API 位址；`API_BASE_URL` token 由應用程式設定提供。
- 套件版本以 `package.json` 與 lockfile 為準；建置與測試設定以 `angular.json` 為準。

## 修改原則

- 先觀察相關功能的實作與測試，沿用所在模組的模式。專案含有不同階段的寫法，不因單次任務進行全域遷移。
- 保持修改聚焦，不順手重構無關功能、變更 API 契約或升級依賴。
- 格式遵循 `.prettierrc.json`，維持 TypeScript strict 與 Angular strictTemplates 設定。
- 後端契約、重構目標與舊資料相容性若無明確依據，不自行杜撰；整合問題再取得相關契約、範例資料或後端位置。
- 修改相關功能時，若發現 spec 與實作不符，明確指出差異；需要更新文件時以核對後的內容為準，不全面重寫或複製程式碼型別清單。

## Angular 寫法優先順序

- 新增或修改相關程式碼時，優先使用目前專案 Angular 版本支援的現代 API；此規則優先於沿用模組中的舊寫法，不為此進行無關的全域遷移。
- Dependency Injection 優先使用欄位 `inject()`，不新增 constructor parameter injection；constructor 可保留必要的初始化邏輯。
- 查詢優先使用 Signal API：`viewChild()`、`viewChildren()`、`contentChild()`、`contentChildren()`；只有確定必定存在的查詢才使用 `.required()`。
- 元件介面優先使用 `input()`、`output()`；需要雙向綁定時使用 `model()`。
- 表單優先使用 Signal Forms，資料維持單一來源；在初始化的 injection context 建立 `form()`，不要在 template 呼叫的方法或其他 reactive context 中動態建立 form 或 effect。
- 狀態與衍生值優先使用 `signal()`、`computed()`；確有相依且可編輯的狀態才使用 `linkedSignal()`。`effect()` 用於必要的副作用，不用來複製可直接衍生的狀態。
- template 優先使用 `@if`、`@for`、`@switch`。非同步流程依需求使用 RxJS、`toSignal()` 或 resource，不為採用新 API 強行改寫。
- 遇到相容性或生命週期限制時，採用可驗證正確的做法，並說明原因，不只因 API 較新就使用。

## 開發與驗證

- 安裝依賴：`npm ci`；啟動開發伺服器：`npm start`。
- 建置驗證：`npx --no-install ng build`。
- 單元測試：`npm test -- --watch=false`；依變更範圍選擇相關測試，必要時執行完整測試。
- `npm run build` 會自動觸發 `postbuild`，再次執行 production 建置並執行 `move-files.js`。該腳本會清空 `C:/code/nginx/html/list-project-angular` 後複製產物；一般驗證使用上述直接呼叫 Angular CLI 的指令。只有任務包含部署時才執行此流程。
- 純文件修改不需要執行 Angular 建置或測試。程式碼修改後執行適當驗證，交付時說明結果與未能驗證的部分。
