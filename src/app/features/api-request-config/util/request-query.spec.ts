import { ApiRequestQueryParam } from '../model';
import {
  buildRequestUrl,
  parseQueryParameters,
  synchronizeQueryParameters,
} from './request-query';

const row = (
  name: string,
  value: string,
  enabled = true
): ApiRequestQueryParam => ({
  seq: 0,
  name,
  value,
  enabled,
});

describe('請求 URL 與 Params 同步', () => {
  it('保留重複 Key 與空值，無等號參數統一為空字串並解碼一般 Query 字元', () => {
    expect(
      parseQueryParameters(
        'https://example.com/items?tag=a&tag=b&name=%E7%94%B2+%E4%B9%99&flag&empty=#part'
      )
    ).toEqual([
      row('tag', 'a'),
      row('tag', 'b'),
      row('name', '甲 乙'),
      { seq: 0, name: 'flag', value: '', enabled: true },
      row('empty', ''),
    ]);
  });

  it('重建 URL 時將無等號參數統一為 key=value', () => {
    const url = '/items?flag&empty=';
    expect(buildRequestUrl(url, parseQueryParameters(url))).toBe(
      '/items?flag=&empty='
    );
  });

  it('忽略空參數片段，只以第一個等號切分 name 與 value', () => {
    expect(parseQueryParameters('/items?&token=a=b=c&&empty=&')).toEqual([
      row('token', 'a=b=c'),
      row('empty', ''),
    ]);
    expect(buildRequestUrl('/items#', [])).toBe('/items#');
  });

  it('同時保留兩種變數標記內的分隔符號', () => {
    const url =
      '/${path?#=a&b}?first=${value?a=b&c#d}&second={{$.item[?(@.id==1)]}}#end';
    const params = parseQueryParameters(url);
    expect(params).toEqual([
      row('first', '${value?a=b&c#d}'),
      row('second', '{{$.item[?(@.id==1)]}}'),
    ]);
    expect(buildRequestUrl(url, params)).toBe(url);
  });

  it('將變數標記內的分隔符號視為原文，不解析 JSONPath', () => {
    const template = '{{$.items[?(@.id==1 && @.enabled)].id}}';
    const url = `https://example.com/{{$.path[?(@.id==1)]}}?id=${template}&name=ok#section`;
    const params = parseQueryParameters(url);
    expect(params).toEqual([row('id', template), row('name', 'ok')]);
    expect(buildRequestUrl(url, params)).toBe(url);
  });

  it('表格更新 URL 時保留片段、編碼值的分隔符號，並排除停用列', () => {
    const params = [
      row('tag', 'a'),
      row('tag', 'b'),
      row('query', 'a&b=c#d space'),
      row('id', '{{$.id}}'),
      row('path', '$.id'),
      row('disabled', 'kept', false),
    ];
    expect(
      buildRequestUrl('https://example.com/items?old=1#detail', params)
    ).toBe(
      'https://example.com/items?tag=a&tag=b&query=a%26b%3Dc%23d%20space&id={{$.id}}&path=$.id#detail'
    );
    expect(
      parseQueryParameters(buildRequestUrl('https://example.com', params))
    ).toEqual(params.filter(value => value.enabled));
  });

  it('停用後修改 URL 仍保留未送出的列，再輸入該參數會重新啟用', () => {
    const previous = [row('keep', '1'), row('draft', '2', false)];
    const changed = synchronizeQueryParameters(
      'https://example.com?keep=3',
      previous
    );
    expect(changed).toEqual([row('keep', '3'), row('draft', '2', false)]);
    expect(
      synchronizeQueryParameters('https://example.com?keep=3&draft=2', changed)
    ).toEqual([row('keep', '3'), row('draft', '2')]);
    expect(previous[1].enabled).toBe(false);
  });

  it('只修改網址路徑時保留表格順序及停用列的位置', () => {
    const previous = [
      row('tag', 'a'),
      row('draft', '2', false),
      row('tag', 'b'),
    ];
    expect(
      synchronizeQueryParameters(
        'https://other.example/items?tag=a&tag=b',
        previous
      )
    ).toEqual(previous);
  });

  it('URL 重新啟用一筆重複參數時，仍保留其餘停用列且不修改來源', () => {
    const previous = [row('tag', 'a', false), row('tag', 'a', false)];
    const result = synchronizeQueryParameters('/items?tag=a', previous);
    expect(result).toEqual([row('tag', 'a'), row('tag', 'a', false)]);
    result[1].value = 'edited';
    expect(previous).toEqual([row('tag', 'a', false), row('tag', 'a', false)]);
  });

  it('編碼值不會重複編碼，無效百分比文字不會拋出例外', () => {
    const params = parseQueryParameters(
      '/items?value=a%26b&percent=%ZZ#fragment?not=query'
    );
    expect(params).toEqual([row('value', 'a&b'), row('percent', '%ZZ')]);
    expect(buildRequestUrl('/items#fragment', params)).toBe(
      '/items?value=a%26b&percent=%25ZZ#fragment'
    );
  });

  it('移除或停用全部參數時移除問號並保留片段', () => {
    expect(
      buildRequestUrl('/items?key=value#detail', [row('key', 'value', false)])
    ).toBe('/items#detail');
    expect(parseQueryParameters('/items#detail?key=value')).toEqual([]);
  });
});
