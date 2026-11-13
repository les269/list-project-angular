import { EnumOptionsPipe } from './util.pipe';

enum RequestMethod {
  get = 'get',
  post = 'post',
}

const pipe = new EnumOptionsPipe();

describe('EnumOptionsPipe', () => {
  it('將字串 enum 的值轉成選項', () => {
    expect(pipe.transform(RequestMethod)).toEqual([
      { value: 'get', label: 'get' },
      { value: 'post', label: 'post' },
    ]);
  });

  it('可將顯示文字轉成大寫，保留原始值', () => {
    expect(pipe.transform(RequestMethod, '', true)).toEqual([
      { value: 'get', label: 'GET' },
      { value: 'post', label: 'POST' },
    ]);
  });

  it('有翻譯前綴時建立翻譯 key，交由欄位元件翻譯', () => {
    expect(pipe.transform(RequestMethod, 'methods')).toEqual([
      { value: 'get', label: 'methods.get' },
      { value: 'post', label: 'methods.post' },
    ]);
  });
});
