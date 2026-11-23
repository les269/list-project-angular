import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { apiInterceptor } from '../../../core/interceptors/api.interceptor';
import { API_BASE_URL } from '../../../core/tokens/api-base-url.token';
import { SearchBookmarkService } from './search-bookmark.service';

describe('SearchBookmarkService', () => {
  let service: SearchBookmarkService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(SearchBookmarkService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('依書籤 ID 查詢多筆資料時正確編碼參數，並沿用 API prefix', async () => {
    const id = '測試+a & b?#';
    const result = firstValueFrom(service.getItemById(id));
    const req = http.expectOne(
      request => request.url === '/api/search-bookmark/item/get'
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual(['id']);
    expect(req.request.params.get('id')).toBe(id);
    expect(req.request.urlWithParams).toContain('%2B');
    expect(req.request.urlWithParams).toContain('%26');
    expect(req.request.urlWithParams).toContain('%23');
    const items = [
      { id, value: 'first', seq: 1 },
      { id, value: 'second', seq: 2 },
    ];
    req.flush(items);
    expect(await result).toEqual(items);
  });

  it('空書籤直接回傳空陣列', async () => {
    const result = firstValueFrom(service.getItemById('empty'));
    http.expectOne('/api/search-bookmark/item/get?id=empty').flush([]);
    expect(await result).toEqual([]);
  });

  it('使用 PUT 一次送出完整順序並保留搜尋原文，回傳後端 seq', async () => {
    const payload = { id: 'bookmark', values: [' and:a+b & c?# ', 'second'] };
    const result = firstValueFrom(service.updateItemOrder(payload));
    const req = http.expectOne('/api/search-bookmark/item/order');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    const response = payload.values.map((value, index) => ({
      id: payload.id,
      value,
      seq: index + 1,
    }));
    req.flush(response);
    expect(await result).toEqual(response);
  });

  it('儲存主表與明細時回傳後端結果，保留各自的 id', async () => {
    const bookmark = firstValueFrom(service.update({ name: '搜尋紀錄' }));
    const bookmarkReq = http.expectOne('/api/search-bookmark/update');
    expect(bookmarkReq.request.method).toBe('POST');
    expect(bookmarkReq.request.body).toEqual({ name: '搜尋紀錄' });
    bookmarkReq.flush({ id: 'bookmark-1', name: '搜尋紀錄' });
    expect(await bookmark).toEqual({ id: 'bookmark-1', name: '搜尋紀錄' });

    const item = firstValueFrom(
      service.updateItem({ id: 'bookmark-1', value: 'test' })
    );
    const itemReq = http.expectOne('/api/search-bookmark/item/update');
    expect(itemReq.request.method).toBe('POST');
    expect(itemReq.request.body).toEqual({
      id: 'bookmark-1',
      value: 'test',
    });
    itemReq.flush({ id: 'bookmark-1', value: 'test', seq: 3 });
    expect(await item).toEqual({ id: 'bookmark-1', value: 'test', seq: 3 });
  });

  it('明細刪除失敗時傳遞錯誤，讓呼叫端處理', async () => {
    const value = ' and:測試,a+b & c?# ';
    const result = firstValueFrom(service.deleteItemById('item & 1', value));
    const assertion = expect(result).rejects.toMatchObject({ status: 500 });
    const req = http.expectOne(
      request => request.url === '/api/search-bookmark/item/delete'
    );
    expect(req.request.method).toBe('DELETE');
    expect(req.request.params.get('id')).toBe('item & 1');
    expect(req.request.params.keys()).toEqual(['id', 'value']);
    expect(req.request.params.get('value')).toBe(value);
    expect(req.request.urlWithParams).toContain('%2B');
    expect(req.request.urlWithParams).toContain('%26');
    expect(req.request.urlWithParams).toContain('%23');
    req.flush('Request failed', { status: 500, statusText: 'Server Error' });
    await assertion;
  });
});
