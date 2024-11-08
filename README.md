# 自定義清單系統

## 描述

這是一個來顯示清單的系統，需要配置清單主題、資料欄位、資料來源，可以配置自定義設定來執行一些功能像是開啟新頁視窗或複製值
當需要呼叫其他系統的API可以到配置API清單
需搭配後端 https://github.com/les269/listProjectBackend

## 目錄

- [安裝](#安裝)
- [使用方法](#使用方法)

## 安裝

1. clone：
   ```bash
   git clone https://github.com/les269/list-project-angular.git
   ```
2. install：
   ```bash
   npm install
   ```

## 使用方法

執行程式：

```bash
   nx serve
```

## 預覽

## 新功能

| 順序 | 新功能                                                                                                                                   | 進度    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1    | 爬蟲清單-使用css select                                                                                                                  | done    |
| 2    | 創建資料清單 設定key和顯示的label(考慮新增資料型別可以陣列,數字,date之類的) 設定要使用的爬蟲清單                                         | done    |
| 3    | 根據設定的資料夾去找資料夾內部的檔案名稱或是資料夾名稱來爬蟲                                                                             | done    |
| 4    | 編輯資料清單內容 可以使用爬蟲來注入資料或是手動新增修改                                                                                  | done    |
| 5    | 圖片清單 新增refresh api或自定義按鈕到header上面可以放在group旁邊                                                                        | done    |
| 6    | 圖片清單 當沒label就全部顯示圖片(onlyImageList) 當沒圖片全部顯示label(labelList) 都導航到imageLsit                                       | cancel  |
| 7    | 圖片清單 顯示一個可以記錄當前觀看進度的slider(感覺電影可以用但時間如何記錄)                                                              | cancel  |
| 8    | 圖片清單 顯示一個可以記錄當前觀看集數,是否已看跟目前看到的集數(用很多按鈕?),考慮是否可以同一筆資料是否只能有一種集數還是包含多季跟電影版 | cancel  |
| 9    | 圖片清單 顯示可以快速編輯資料的按鈕(那我要如何處置舊版清單的資料@@)                                                                      | done    |
| 10   | 可以import export各清單成json檔案 (優先度最低)                                                                                           | pending |
| 11   | table清單顯示一個table,那需要考慮到原本舊版的按鈕如何搬過來                                                                              | done    |
| 12   | 可以在網址上給json網址然後檢查config然後顯示成清單 (優先度最低)                                                                          | pending |
| 13   | 圖片清單 需要標籤用來快速過濾,像是待看或是我的最愛這種                                                                                   | done    |
| 14   | 是否可以讓angular跟spring包成一個執行檔案 (優先度最低)                                                                                   | pending |
| 15   | 爬蟲,資料集群組,清單設定處理日期格式 (優先度最低)                                                                                        | pending |
| 16   | 重構 image list (優先度最低)                                                                                                             | pending |
| 17   | 資料集群組設定可以使用api為獲取資料的手段                                                                                                | done    |
| 18   | 字串對照清單-把原本可能為日文替換成中文                                                                                                  | doing   |
| 19   | 一個可以隨便留言的看板 不需要即時通訊                                                                                                    | pending |
| 20   | note要找別得文字編輯器 有bug                                                                                                             | pending |
| 21   | 清單搜尋改為Chip多選                                                                                                                     | doing   |
| 22   | 畫廊模式                                                                                                                                 | pending |

聯繫我(replay) : 6x8sckva7@mozmail.com
