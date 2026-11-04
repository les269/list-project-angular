import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SpiderPaginationDataService } from './spider-pagination-data.service';

describe('SpiderPaginationDataService 分組識別', () => {
  let service: SpiderPaginationDataService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SpiderPaginationDataService,
      ],
    });
    service = TestBed.inject(SpiderPaginationDataService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('相同 dataId 可透過不同 groupId 取得不同資料', async () => {
    const groups = ['anime-2025', 'anime-2026'];
    const pending = groups.map(group =>
      firstValueFrom(service.getById('anime', group, 'anime-A'))
    );
    groups.forEach(groupId => {
      http
        .expectOne(
          `/spider-pagination-data?spiderPaginationId=anime&groupId=${groupId}&dataId=anime-A`
        )
        .flush({
          spiderPaginationId: 'anime',
          groupId,
          dataId: 'anime-A',
          data: { id: 'anime-A' },
        });
    });
    const records = await Promise.all(pending);
    expect(records.map(record => record.groupId)).toEqual(groups);
    expect(records.map(record => record.dataId)).toEqual([
      'anime-A',
      'anime-A',
    ]);
  });

  it('刪除與存在檢查都包含分組，避免作用到其他年度', async () => {
    const deleting = firstValueFrom(
      service.delete('anime', 'anime-2026', 'anime-A')
    );
    const request = http.expectOne(
      '/spider-pagination-data/delete?spiderPaginationId=anime&groupId=anime-2026&dataId=anime-A'
    );
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    await deleting;
    const checking = firstValueFrom(
      service.isInUse('anime', 'anime-2025', 'anime-A')
    );
    http
      .expectOne(
        '/spider-pagination-data/in-use?spiderPaginationId=anime&groupId=anime-2025&dataId=anime-A'
      )
      .flush(true);
    expect(await checking).toBe(true);
  });
});
