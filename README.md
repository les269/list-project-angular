# 自定義清單系統

## 描述

這是一個來顯示清單的系統，需要配置清單主題、資料欄位、資料集，可以配置自定義設定來執行一些功能。
需搭配後端 https://github.com/les269/listProjectBackend

## 目錄

- [使用方法](#使用方法)
- [配置](#配置)
- [呈現畫面](#呈現畫面)

## 使用方法

1. clone：
   ```bash
   git clone https://github.com/les269/list-project-angular.git
   ```
2. install：
   ```bash
   npm install
   ```
3. run
   ```bash
   nx serve
   ```

## 配置

[清單列表](./public/md/list.md)
[資料集群組](./public/md/dataset-group.md)
[資料集](./public/md/dataset.md)
[爬蟲設定清單](./public/md/scrapy.md)
[API設定清單](./public/md/api.md)
[替換文字清單](./public/md/replace-value-map.md)

## 呈現畫面

- **圖片清單**
  ![動畫清單](./public/md-img/動畫清單.png)

- **table表格**
  ![動畫清單](./public/md-img/動畫清單-table.png)

## 新功能

| 順序 | 新功能                                                          | 進度    | 備註 |
| ---- | --------------------------------------------------------------- | ------- | ---- |
| 10   | 可以import export各清單成json檔案 (優先度最低)                  | pending |      |
| 12   | 可以在網址上給json網址然後檢查config然後顯示成清單 (優先度最低) | pending |      |
| 14   | 是否可以讓angular跟spring包成一個執行檔案 (優先度最低)          | pending |      |
| 15   | 爬蟲,資料集群組,清單設定處理日期格式 (優先度最低)               | pending |      |
| 21   | 清單搜尋可以根據label勾選來配置autocomplete                     | doing   |      |

聯繫我(replay) : 6x8sckva7@mozmail.com
