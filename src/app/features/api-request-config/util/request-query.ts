import { ApiRequestQueryParam, createApiRequestQueryParam } from '../model';

// 變數標記只保留原文，不在前端解析或執行其中的 JSONPath。
const templatePattern = /\{\{[\s\S]*?\}\}|\$\{[\s\S]*?\}/g;
// 先匹配完整變數標記，避免把標記內的 ?、#、&、= 當成 URL 分隔符號。
const urlTokenPattern = new RegExp(`${templatePattern.source}|[?&#=]`, 'g');

/** 在分隔符號前切成兩段；後段保留分隔符號，找不到時回傳空字串。 */
function splitBeforeDelimiter(
  value: string,
  delimiter: string
): [string, string] {
  for (const match of value.matchAll(urlTokenPattern)) {
    if (match[0] === delimiter) {
      return [value.slice(0, match.index), value.slice(match.index)];
    }
  }
  return [value, ''];
}

/** 只轉換一般文字，變數標記保持原樣，避免編碼破壞後端的變數語法。 */
function transformLiteralText(
  value: string,
  transform: (text: string) => string
): string {
  let result = '';
  let position = 0;
  for (const match of value.matchAll(templatePattern)) {
    result += transform(value.slice(position, match.index)) + match[0];
    position = match.index + match[0].length;
  }
  return result + transform(value.slice(position));
}

function decodePart(value: string): string {
  return transformLiteralText(value, text => {
    try {
      return decodeURIComponent(text.replace(/\+/g, ' '));
    } catch {
      // 無效的百分比編碼保留原文，讓使用者仍可編輯。
      return text;
    }
  });
}

function encodePart(value: string): string {
  return transformLiteralText(value, text =>
    encodeURIComponent(text).replace(/%24/g, '$')
  );
}

/** 先分離 fragment，再拆 query，避免將 # 後的內容當成參數。 */
function splitUrl(url: string): {
  base: string;
  query: string;
  fragment: string;
} {
  const [path, fragment] = splitBeforeDelimiter(url, '#');
  const [base, query] = splitBeforeDelimiter(path, '?');
  return { base, query: query.slice(1), fragment };
}

/** 依 URL 順序解析參數，保留重複 Key；無等號參數的 value 為空字串，seq 交由表格編號。 */
export function parseQueryParameters(url: string): ApiRequestQueryParam[] {
  const rows: ApiRequestQueryParam[] = [];
  let remaining = splitUrl(url).query;
  while (remaining) {
    const [parameter, tail] = splitBeforeDelimiter(remaining, '&');
    remaining = tail.slice(1);
    if (!parameter) continue;

    const [name, value] = splitBeforeDelimiter(parameter, '=');
    rows.push(
      createApiRequestQueryParam({
        name: decodePart(name),
        value: decodePart(value.slice(1)),
      })
    );
  }
  return rows;
}

/** 以表格中啟用且非空白的列重建 query，保留網址路徑與 fragment，統一輸出 key=value。 */
export function buildRequestUrl(
  url: string,
  rows: ApiRequestQueryParam[]
): string {
  const { base, fragment } = splitUrl(url);
  const query = rows
    .filter(row => row.enabled && (row.name !== '' || row.value !== ''))
    .map(row => `${encodePart(row.name)}=${encodePart(row.value)}`)
    .join('&');
  return `${base}${query ? `?${query}` : ''}${fragment}`;
}

/**
 * 使用者修改 URL 後，以 URL 的 query 更新啟用列，並保留未重新啟用的停用列。
 * 若用於載入 DB 資料，URL 未包含的啟用列會被移除；此函式並非單純補預設值。
 */
export function synchronizeQueryParameters(
  url: string,
  previous: ApiRequestQueryParam[]
): ApiRequestQueryParam[] {
  const parsed = parseQueryParameters(url);
  const active = previous.filter(
    row => row.enabled && (row.name !== '' || row.value !== '')
  );

  // query 沒變時保留原順序，避免只修改路徑就挪動停用列或刪除尚未填寫的列。
  if (
    active.length === parsed.length &&
    active.every(
      (row, i) => row.name === parsed[i].name && row.value === parsed[i].value
    )
  ) {
    return structuredClone(previous);
  }

  // 一筆 URL 參數只對應一筆停用列，避免重複 Key 被一次全部移除。
  const unmatched = [...parsed];
  const stillDisabled = previous.filter(row => {
    if (row.enabled) return false;
    const index = unmatched.findIndex(
      parameter => row.name === parameter.name && row.value === parameter.value
    );
    if (index === -1) return true;
    unmatched.splice(index, 1);
    return false;
  });
  return [...parsed, ...structuredClone(stillDisabled)];
}
