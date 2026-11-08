import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SpiderPaginationData } from '../model';
import { SpiderService } from './spider.service';

describe('SpiderService 分頁執行', () => {
  let service: SpiderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SpiderService,
      ],
    });
    service = TestBed.inject(SpiderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('預設 force=false，回傳本次成功寫入的分組資料', async () => {
    const result = firstValueFrom(service.executePagination('anime'));
    const request = http.expectOne(
      '/spider/execute-pagination?spiderPaginationId=anime&force=false'
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    const records: SpiderPaginationData[] = [
      {
        spiderPaginationId: 'anime',
        groupId: 'anime-2026',
        dataId: 'anime-A',
        data: { id: 'anime-A' },
      },
      {
        spiderPaginationId: 'anime',
        groupId: 'anime-2025',
        dataId: 'anime-A',
        data: { id: 'anime-A' },
      },
    ];
    request.flush(records);
    expect(await result).toEqual(records);
  });

  it.each([false, true])(
    '正確編碼設定 ID 並傳送指定的 force=%s，允許無資料寫入',
    async force => {
      const result = firstValueFrom(
        service.executePagination('anime/年度 &?=#', force)
      );
      const request = http.expectOne(
        `/spider/execute-pagination?spiderPaginationId=anime%2F%E5%B9%B4%E5%BA%A6%20%26%3F%3D%23&force=${force}`
      );
      expect(request.request.method).toBe('POST');
      request.flush([]);
      expect(await result).toEqual([]);
    }
  );

  it('執行失敗時傳遞 HTTP 錯誤', async () => {
    const result = firstValueFrom(service.executePagination('anime'));
    const assertion = expect(result).rejects.toMatchObject({ status: 500 });
    http
      .expectOne(
        '/spider/execute-pagination?spiderPaginationId=anime&force=false'
      )
      .flush('Execution failed', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    await assertion;
  });
});
