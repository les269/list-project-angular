# 爬蟲設定操作手冊

本手冊說明如何建立由多個爬蟲項目組成的流程、組合 URL、擷取 HTML／JSON，以及設定 pipeline。先用固定回應測試擷取規則，再儲存、綁定項目並測試實際請求，可以分開排查「規則錯誤」與「請求錯誤」。

範圍為 `SpiderConfig`、`SpiderItem` 與共用 pipeline；分頁爬蟲的參數展開、更新控制與資料保存另有流程，不直接套用本手冊的整套測試步驟。

核對日期：2026-11-25。後端依據為 GitHub commit [`4f2d056`](https://github.com/les269/listProjectBackend/tree/4f2d056a9bdaaf54e2526901aaed7e8298b9c26a) 與當日 [OpenAPI](http://192.168.0.193:8081/list-project-backend/v3/api-docs)。部署中的服務是否與此 commit 相同，仍需確認；本手冊的範例未對外部網站實際執行。已發現的問題集中於[後端核對事項](spider-backend-review.md)。

同日後端交接回覆另涵蓋未提交變更：`INITIAL_KEYS` 已實作，URL 執行／預覽沒有主鍵時為 `[]`；實際執行 URL 為空時可不發 HTTP 而執行 pipeline，Unix 毫秒時間可用 `#nowMillis()`。執行錯誤可能記錄 log 後繼續，回傳部分結果。這些更新依後端回覆記錄，尚未完成部署與 HTTP 端到端驗收。

## 先理解三種設定

| 設定       | 負責的事情                                  | 儲存方式                   |
| ---------- | ------------------------------------------- | -------------------------- |
| 爬蟲主設定 | 爬蟲 ID、說明、主鍵數量、URL 模式與請求間隔 | 頁面主設定的儲存按鈕       |
| 爬蟲項目   | 某一步的 URL、擷取規則與 pipeline           | 該項目的新增／儲存按鈕     |
| 綁定       | 哪個爬蟲使用哪些項目，以及執行順序          | 該項目的綁定／解除綁定按鈕 |

儲存主設定不會一併儲存所有項目。新增 tab 只建立編輯區；項目儲存後，還要綁定才會加入整套執行。項目可以被其他爬蟲引用，修改前先確認共用範圍。

整套執行會依綁定的 `executionOrder` 取得項目。各項目共用一份從 `{}` 開始的結果物件 `result`，後面的擷取規則或 URL 可以引用前面已寫入的值。

```text
主鍵或手動輸入的 URL
  → 決定這一步是否執行
  → 組合這一步的 URL
  → 計算這一步的 Headers 與 Cookies
  → 等待請求間隔並送出 HTTP GET
  → 依序檢查擷取規則的條件
  → 擷取資料並執行各規則的 pipeline
  → 寫入共用 result
  → 執行下一個已綁定項目
```

這個順序很重要：一般有 URL 的請求流程中，同一項目的擷取 pipeline 在 HTTP 請求之後執行，因此無法先產生值，供該項目自己的 URL 使用。依後端補充，實際執行 URL 為空時不發 HTTP，改以空 JSON／HTML 執行 pipeline，可將初始化結果供下一步 URL 使用；`use-url` 的覆蓋限制見時間參數範例。

## 建立第一個可測試的項目

1. 建立並儲存爬蟲主設定，例如 `example-product`。若要從商品 ID 開始，使用主鍵模式，主鍵數量填 `1`，先不要啟用僅 URL 模式。
2. 新增項目 tab，填入獨立項目 ID，例如 `example-product-detail`。
3. 選擇「使用主鍵組組成網址」，URL 填入 `https://example.com/products/{{$[0]}}`。
4. 選擇 HTML 的 `SELECT` 或 JSON 的 `JSON_PATH`，建立擷取規則，先依下一節做離線測試。
5. 在項目區按新增；修改既有項目時按該區的儲存。
6. 將項目綁定到目前爬蟲。
7. 回到整套測試區，主鍵 JSON 填入 `["123"]`，執行主鍵測試。

`example.com` 僅用來示意 URL；實際執行前需換成目標網站。主鍵輸入必須是字串陣列；`[123]`、`{"id":"123"}` 都不是目前前端接受的格式。

主設定的 `requestIntervalMs` 單位是毫秒。這版後端會在第二次及之後的請求前等待，第一次不等待。前端會依 URL 模式調整主鍵數量欄位的最低值，但不能據此推定後端已驗證傳入陣列長度。

## 分清楚兩種測試

| 操作位置                         | 使用的資料                     | 測得到的範圍                                   |
| -------------------------------- | ------------------------------ | ---------------------------------------------- |
| 項目內貼上 HTML／JSON，按測試    | 畫面目前的項目設定與貼上的內容 | 擷取規則與 pipeline；不向目標 URL 發出爬取請求 |
| 項目內上傳 HTML／JSON 檔案後測試 | 目前設定與檔案內容             | 擷取規則與 pipeline；不驗證實際連線            |
| 主設定頁的主鍵／URL 測試         | 指定爬蟲 ID、輸入主鍵或 URL    | 後端載入已儲存、已綁定項目後執行實際請求       |

因此「擷取測試成功」不代表目標網站可正常連線；「整套測試沒有使用剛才的修改」則要先檢查項目是否已儲存、綁定是否正確。

離線預覽的 `result` 每次從 `{}` 開始，不會自動帶入主鍵、上一個項目的結果或上次測試結果。前端的 `resultJson` 欄位也不是供下一次測試使用的輸入 context。涉及跨項目參數時，單獨預覽可能無法重現整套執行。

後端仍會依項目 ID 讀取已綁定的 Cookie／Header 清單並計算其值；預覽不是完全不接觸後端資料的純前端操作。

## URL 與參數來源

### 使用主鍵執行

| URL 使用方式   | 替換資料來源              | 範例                                                   |
| -------------- | ------------------------- | ------------------------------------------------------ |
| `BY_PRIME_KEY` | 本次輸入的主鍵字串陣列    | `["123","zh-TW"]` 搭配 `?id={{$[0]}}&lang={{$[1]}}`    |
| `BY_PARAMS`    | 前面已寫入的共用 `result` | `{"product":{"id":"123"}}` 搭配 `?id={{$.product.id}}` |

`BY_PRIME_KEY` 不限定只能出現在第一個項目；主鍵執行時，每個此類項目都使用同一份主鍵陣列。`BY_PARAMS` 引用的是累積結果，不是尚未請求的回應內容。

假設第一步得到：

```json
{ "product": { "id": "123" }, "token": "abc" }
```

第二步可設成：

```text
https://example.com/api/detail?id={{$.product.id}}&token={{$.token}}
```

路徑缺漏或值為 `null` 時，這版 `JsonUtils` 會保留原本的佔位符，例如 `{{$.token}}`，不會自動變成空字串。它也沒有逐一對替換值做 query percent-encoding；含 `&`、`#` 等字元時需特別核對實際請求，不能假設會安全組合成單一參數。

### 使用手動 URL 執行

URL 執行與主鍵執行的規則不同：

1. 在尚未發出第一個請求之前，`skipWhenUsingUrl=true` 的項目會被跳過。
2. 第一個實際執行的項目直接使用測試區輸入的 URL，覆蓋該項目的 URL 範本，這個分支不做範本替換。
3. 第一個請求之後，`BY_PRIME_KEY` 項目會被跳過；其餘項目使用 `result` 替換自己的 URL。

`skipWhenUsingUrl` 不表示「URL 執行時永遠跳過這個項目」。目前實作只在第一個請求之前檢查它。這個差異會影響共用同一套項目的兩種執行方式。

## HTML 擷取範例

在項目測試區貼上：

```html
<h1 class="product-title">Sample Product</h1>
<a class="detail-link" href="https://example.com/detail/123">Detail</a>
```

選擇 `SELECT`，建立以下規則，條件保持「總是提取」：

| 順序 | 結果 key    | selector         | pipeline 順序                                 | 預期結果                           |
| ---- | ----------- | ---------------- | --------------------------------------------- | ---------------------------------- |
| 1    | `title`     | `.product-title` | 不設定                                        | `["Sample Product"]`               |
| 2    | `detailUrl` | `.detail-link`   | `EXTRACT_ATTR`，屬性填 `href` → `FIRST_VALUE` | `"https://example.com/detail/123"` |

按項目內測試，預期得到：

```json
{
  "title": ["Sample Product"],
  "detailUrl": "https://example.com/detail/123"
}
```

外層 HTML 規則沒有啟用的 pipeline 時，後端會取得匹配元素的 `text()` 清單。若有啟用 pipeline，初始值則是 `null`，匹配元素另外放在 context；不要以為只放 `FIRST_VALUE` 就能自動取得第一個元素文字。取屬性應先放 `EXTRACT_ATTR`；`EXTRACT_OWN_TEXT` 只取元素自身文字，不含子元素文字。

例如 `.detail-link` 找不到元素時，不能只憑最後的空值判定 class 已變更：也可能收到的是登入頁或驗證頁。應先確認後端取得的實際回應，再核對 selector。

## JSON 擷取與計算範例

貼上以下測試 JSON，擷取模式選 `JSON_PATH`：

```json
{ "data": { "price": "120", "qty": "2" } }
```

依序新增規則：

| 順序 | 結果 key | jsonPath       | pipeline    |
| ---- | -------- | -------------- | ----------- |
| 1    | `price`  | `$.data.price` | 無          |
| 2    | `qty`    | `$.data.qty`   | 無          |
| 3    | `total`  | `$`            | `CALCULATE` |

第三條規則的計算設定：

| 設定       | 填寫內容                             |
| ---------- | ------------------------------------ |
| 變數對應   | `price` → `$.price`，`qty` → `$.qty` |
| 運算式     | `#price * #qty`                      |
| 失敗預設值 | `0`                                  |

變數對應左邊填名稱，運算式內才加 `#`。變數路徑讀取的是前兩條規則已寫入的 `result`，因此是 `$.price`，不是原始回應中的 `$.data.price`。計算不會自動把目前 pipeline 的輸入命名為 `#value`。

預期結果為：

```json
{ "price": "120", "qty": "2", "total": "240" }
```

`CALCULATE` 會將成功結果轉成字串。計算出錯時，會嘗試將預設值當作 `result` 路徑讀取；找不到則使用原字串。不能因為整體測試成功，就認為計算也成功了。

運算式使用受限 SpEL，詳細函式與限制請看後端的[計算指南](https://github.com/les269/listProjectBackend/blob/4f2d056a9bdaaf54e2526901aaed7e8298b9c26a/public/md/expression-guide.md)。`T(java.lang.System).currentTimeMillis()`、`new`、字串字面值及方法呼叫不適用這個計算器。前端型別註解中的 `#{variable}` 也不應直接照填；核對後的語法是 `#variable`。

## pipeline 與資料範圍

每條擷取規則的 pipeline 依 `seq` 執行，只處理 `enabled=true` 的操作；前一個操作的輸出成為下一個操作的輸入。整條規則完成後，才將最終值寫入該規則的結果 key。

| 需求                           | 操作與注意事項                                                    |
| ------------------------------ | ----------------------------------------------------------------- |
| 固定字串或 JSON                | `FIXED_VALUE`／`FIXED_JSON_VALUE`；後者 JSON 解析失敗時會保留字串 |
| 讀取先前的結果                 | `CURRENT_DATA_KEY`，路徑指向目前層級的 `result`                   |
| 用目前值組合字串               | `COMBINE_TO_STRING`，例如輸入陣列用 `{{$[0]}}`                    |
| 用累積結果組合字串             | `COMBINE_BY_KEY`，例如 `{{$.product.id}}`                         |
| 取得 HTML 屬性                 | `EXTRACT_ATTR`；只適用 HTML `SELECT`                              |
| 將每筆資料轉成物件             | `EXTRACT_OBJECTS`；子 selector／jsonPath 相對於該筆來源           |
| 在 Header／Cookie 取用爬取結果 | `FETCH_CURRENT_DATA`；讀取額外傳入的 context                      |

`EXTRACT_OBJECTS` 的子欄位有自己的 pipeline 與 `result`。子欄位的 `CURRENT_DATA_KEY` 讀的是該筆物件已產生的欄位；需要上一層結果時，後端另有 `extraContext`，不可把這兩層當成同一份資料。子欄位留空 selector／jsonPath 表示該筆來源本身，與外層規則的必填限制不同。

外層結果正規化會 trim 字串；一般陣列會移除 `null`、空白字串並去除重複值。含物件的陣列與 `EXTRACT_OBJECTS` 子欄位有不同保留規則，不能用一般文字清單的預期推斷筆數。

## 條件判斷

條件在該條擷取規則執行前，讀取當時的 `result`，不是先擷取本條規則再判斷。規則順序會直接影響結果。

- `ALWAYS`：總是執行。
- `IF_KEY_EMPTY`／`IF_KEY_NOT_EMPTY`：檢查指定結果路徑是否為空；缺少路徑視為空。
- `CONTAINS`：字串使用子字串判斷；清單通常比對元素，不是逐一做子字串搜尋。
- `EQUALS`：這版後端主要處理字串／清單，不能假定 JSON 數字或布林也有相同語意。
- `MATCHES`：使用整個字串的正則匹配；要檢查「包含某段」時可使用 `.*pattern.*`。目前的 `ignoreCase` 沒有套用到這個分支。

若條件不成立，該規則不寫入結果。清單在 `ignoreCase` 開關前後的相等判斷亦有差異，特殊需求請先核對[後端核對事項](spider-backend-review.md)。

## Headers 與 Cookies

項目內的 Headers／Cookies 設定使用 `spiderItemId` 綁定清單。清單與項目主設定分開儲存，操作綁定會立即呼叫 API；不要以為關閉對話框或未儲存主設定就會回復綁定。

請求前會先計算 Header 清單，再計算 Cookie 清單。清單內 `CURRENT_DATA_KEY` 讀取的是該清單已產生的值；要讀取前面爬蟲項目產生的資料，使用 `FETCH_CURRENT_DATA`。

`FETCH_HEADER`／`FETCH_COOKIE` 在實際擷取時讀取的是該次 request 的資料；這版不是用來讀取 response Header 或新收到的 `Set-Cookie`。需要登入更新、跨請求 token 或驗證 Cookie 時，應先確認後端的傳遞機制。

## 時間參數與目前限制

`CURRENT_TIME` 使用 Java `DateTimeFormatter` 產生指定時區的時間字串；一般日期時間可使用 `uuuu-MM-dd HH:mm:ss`。前端目前預設的 `YYYY-MM-dd HH:mm:ss` 中，`Y` 是週曆年，跨年附近可能與一般年份不同，需手動檢查。

`n` 是秒內奈秒，`N` 是當天奈秒，`A` 是當天毫秒；都不是 `1795550130713` 這類 Unix 毫秒時間戳記。依後端最新補充，`CALCULATE` 支援 `#nowMillis()`；初次核對的 GitHub 版本與舊計算指南沒有這個函式，使用前需確認部署版本。

`INITIAL_KEYS` 的前端名稱是「獲得初始主鍵陣列」，屬於 pipeline 類型。初次核對的 GitHub 版本只有 enum；後端最新回覆已補上實作，讀取最初主鍵清單，可跨步驟及在 `EXTRACT_OBJECTS` 子欄位使用。URL 執行與離線預覽未提供主鍵，輸出為 `[]`。使用時需先確認部署版本已包含這次變更。

### 在第一個 HTTP 請求前產生 time

主鍵入口可先安排空 URL 項目初始化，再安排真正的請求項目，依序儲存並綁定。初始化項目使用 `JSON_PATH`、規則 key 填 `time`、jsonPath 填 `$`，pipeline 設為：

```json
{
  "type": "CALCULATE",
  "enabled": true,
  "calculateConfig": {
    "expression": "#nowMillis()",
    "variablePaths": [],
    "defaultValue": ""
  }
}
```

這是單一 pipeline 的設定片段；在畫面新增操作時，順序 `seq` 由清單管理。空 JSON 使用 `$` 可避免讀取不存在的資料路徑；不需要定義計算變數。初始化項目的 URL 留空，下一個項目選 `BY_PARAMS`，例如：

```text
https://example.com/api/products?id=123&time={{$.time}}
```

依後端說明，實際執行 URL 為空的初始化項目不發 HTTP，會以空 JSON／HTML 執行規則；`time` 寫入共用結果後，下一步再替換 URL。此組合範例仍待 HTTP 端到端驗收，另需確認計算失敗時是否應中止，避免空預設值繼續成為請求參數。

**`use-url` 限制**：傳入非空 URL 時，第一個未跳過的項目會直接使用傳入 URL，即使該項目設定的 URL 留空，也會發出請求。因此目前不能用此入口先執行純初始化；設定 `skipWhenUsingUrl` 會連同 pipeline 一起跳過，也無法藉此初始化 `time`。

`@UpdateTimestamp`／`LocalDateTime` 是資料更新時間；這裡使用的是爬取時執行 `#nowMillis()` 取得的 Unix 毫秒值。

## 儲存與刪除的差別

- **讀取項目**：將既有項目載入目前編輯區，不會自動綁定。
- **清除**：重設目前編輯內容，不等於刪除已儲存項目。
- **解除綁定**：移除爬蟲與項目的關係，不刪除項目本身。
- **頁面上方刪除爬蟲項目**：移除目前未綁定的 tab；有綁定時隱藏。這個動作不呼叫項目刪除 API。
- **項目內刪除**：先查詢項目是否被綁定使用，未使用時才確認並刪除資料。

項目 tab 與綁定順序不是同一種資料。解除中間項目的綁定後再移除 tab，其他綁定的 `executionOrder` 是否需要補號，應依後端核對結果處理，不能假設前端 tab 索引永遠等於綁定順序。

## 測試失敗時的排查順序

| 現象                       | 優先確認                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| 修改後整套測試沒變         | 該項目是否已儲存、是否綁到正確的爬蟲與順序                                 |
| URL 執行與主鍵執行結果不同 | URL 覆蓋規則、`skipWhenUsingUrl`、後續 `BY_PRIME_KEY` 跳過規則             |
| URL 還有 `{{...}}`         | 路徑是否存在、來源是主鍵還是 `result`、值是否為 `null`                     |
| selector 找不到資料        | 實際回應是否為預期 HTML、有無登入／驗證頁、class 是否變動                  |
| JSON 擷取失敗              | 回應是否真的是 JSON、jsonPath 是否存在；讀取失敗可能在 pipeline 之前就中斷 |
| 值變成 `null`              | HTML 是否只有 `FIRST_VALUE` 卻沒有先取得文字／屬性、前置資料是否尚未產生   |
| 計算只有預設值             | 變數是否讀對 `result` 路徑、運算式是否符合受限語法                         |
| 時間格式改了卻沒變         | `TIME_FORMAT` 解析失敗會保留原值；`CURRENT_TIME` 非法格式會回空字串        |
| 預覽正常但整套失敗         | 連線、URL、Headers／Cookies、網站回應與固定測試資料是否一致                |

目前一般爬蟲 API 沒有逐步 trace 回傳，畫面也無法顯示每個參數、pipeline 的中間值。遇到上述問題，單看最終 JSON 無法可靠定位中斷點；需要後端執行紀錄或新增測試 trace。預計需要的資訊列於後端核對事項，不代表功能已經提供。

後端最新回覆指出，未提交版執行失敗可能記錄 log 後繼續，呼叫端仍取得部分結果或 `{}`。收到成功 HTTP 回應不等於全部項目執行成功；目前介面缺少可辨識完整成功與部分成功的資料。

## 實作參考

- 前端：[爬蟲編輯頁](../src/app/features/spider/page/spider-edit/spider-edit.component.ts)、[項目編輯](../src/app/features/spider/components/spider-item/spider-item.component.ts)、[擷取規則驗證](../src/app/features/spider/schema/extraction-rules.schema.ts)、[pipeline 預設值](../src/app/features/spider/services/value-pipeline-form.service.ts)。
- 後端：[執行入口與 URL 分支](https://github.com/les269/listProjectBackend/blob/4f2d056a9bdaaf54e2526901aaed7e8298b9c26a/src/main/java/com/lsb/listProjectBackend/service/spider/SpiderServiceImpl.java)、[請求與擷取](https://github.com/les269/listProjectBackend/blob/4f2d056a9bdaaf54e2526901aaed7e8298b9c26a/src/main/java/com/lsb/listProjectBackend/service/spider/SpiderExecutionService.java)、[pipeline](https://github.com/les269/listProjectBackend/blob/4f2d056a9bdaaf54e2526901aaed7e8298b9c26a/src/main/java/com/lsb/listProjectBackend/utils/ValuePipelineUtils.java)、[條件判斷](https://github.com/les269/listProjectBackend/blob/4f2d056a9bdaaf54e2526901aaed7e8298b9c26a/src/main/java/com/lsb/listProjectBackend/service/spider/ExtractionRuleServiceImpl.java)、[URL 替換](https://github.com/les269/listProjectBackend/blob/4f2d056a9bdaaf54e2526901aaed7e8298b9c26a/src/main/java/com/lsb/listProjectBackend/utils/JsonUtils.java)、[時間處理](https://github.com/les269/listProjectBackend/blob/4f2d056a9bdaaf54e2526901aaed7e8298b9c26a/src/main/java/com/lsb/listProjectBackend/utils/DateUtils.java)。
