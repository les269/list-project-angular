import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import {
  EndTimeType,
  ExtractionRuleMode,
  LastUpdateMode,
  ParamType,
  TimeUnit,
  UpdateIntervalMode,
} from '../model';
import { SpiderPaginationService } from './spider-pagination.service';

it.each([
  [undefined, true],
  [null, true],
  [true, true],
  [false, false],
])('getById 將 retainHistory %s 正規化為 %s', async (value, expected) => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      SpiderPaginationService,
    ],
  });
  const service = TestBed.inject(SpiderPaginationService);
  const http = TestBed.inject(HttpTestingController);
  const result = firstValueFrom(service.getById('history'));
  http.expectOne('/spider-pagination?spiderPaginationId=history').flush({
    spiderPaginationId: 'history',
    paginationConfig: {
      ...(value === undefined ? {} : { retainHistory: value }),
      paramSettings: [],
      updateControl: { lastUpdateDate: '2026-11-08T00:00:00+08:00' },
    },
  });
  expect((await result).paginationConfig.retainHistory).toBe(expected);
  http.verify();
});

it('getById 將表單需要的日期還原為 Date，並保留其他設定', async () => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      SpiderPaginationService,
    ],
  });
  const service = TestBed.inject(SpiderPaginationService);
  const http = TestBed.inject(HttpTestingController);
  const result = firstValueFrom(service.getById('anidb/years'));
  const response = {
    spiderPaginationId: 'anidb/years',
    paginationConfig: {
      groupIdTemplate: 'anidb-{year}',
      dataIdKey: 'id',
      startUrl: 'https://example.com/{year}',
      nextPageUrlKey: 'nextUrl',
      requestIntervalMs: 1000,
      extractionRuleMode: ExtractionRuleMode.SELECT,
      extractionRuleList: [],
      paramSettings: [
        {
          seq: 1,
          paramKey: '{year}',
          type: ParamType.TIME_RANGE,
          staticList: [],
          startNumStr: '',
          endNumStr: '',
          numStep: 1,
          padZeros: false,
          startTime: '2026-01-01T00:00:00+08:00',
          timeFormat: 'yyyy',
          timeInterval: 1,
          timeIntervalUnit: TimeUnit.YEAR,
          endTimeConfig: {
            endTimeType: EndTimeType.FIXED,
            endTime: '2026-11-03T12:34:56+08:00',
            timeFormat: 'yyyy-MM-dd',
            offsetInterval: 0,
            offsetUnit: TimeUnit.DAY,
          },
        },
      ],
      updateControl: {
        lastUpdateMode: LastUpdateMode.FIXED,
        lastUpdateDate: '2026-11-02T10:00:00+08:00',
        lastUpdateParamKey: '',
        updateIntervalMode: UpdateIntervalMode.FIXED,
        updateInterval: 1,
        updateIntervalUnit: TimeUnit.DAY,
        updateIntervalParamKey: '',
      },
    },
  };
  const expectedStartTime = new Date(
    response.paginationConfig.paramSettings[0].startTime
  );
  const expectedEndTime = new Date(
    response.paginationConfig.paramSettings[0].endTimeConfig.endTime
  );
  const expectedLastUpdateDate = new Date(
    response.paginationConfig.updateControl.lastUpdateDate
  );
  http
    .expectOne('/spider-pagination?spiderPaginationId=anidb%2Fyears')
    .flush(response);
  const actual = await result;
  const param = actual.paginationConfig.paramSettings[0];
  expect(param.startTime).toEqual(expectedStartTime);
  expect(param.endTimeConfig.endTime).toEqual(expectedEndTime);
  expect(actual.paginationConfig.updateControl.lastUpdateDate).toEqual(
    expectedLastUpdateDate
  );
  expect(actual.paginationConfig.groupIdTemplate).toBe('anidb-{year}');
  expect(actual.paginationConfig.dataIdKey).toBe('id');
  expect(actual.paginationConfig.requestIntervalMs).toBe(1000);
  http.verify();
});
