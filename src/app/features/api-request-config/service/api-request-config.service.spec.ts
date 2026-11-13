import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiRequestBodyType, ApiRequestConfig, HttpMethodType } from '../model';
import { ApiRequestConfigService } from './api-request-config.service';

const itemSettings = {
  httpMethod: HttpMethodType.post,
  endpointUrl: 'https://example.com/{{$.id}}',
  requestBody: '{"id":"{{$.id}}"}',
  bodyType: ApiRequestBodyType.formUrlEncoded,
  bodyFormFields: [{ seq: 0, name: 'id', value: '{{$.id}}', enabled: false }],
  httpParams: [{ seq: 0, name: 'draft', value: 'kept', enabled: false }],
  timeoutMs: 10000,
  enabled: false,
  successMessage: 'Completed',
  custom: [1, false],
};

const item: ApiRequestConfig = {
  apiId: 'update/年度 &?#',
  description: '更新',
  createdTime: new Date('2026-11-01T10:00:00Z'),
  updatedTime: new Date('2026-11-10T12:00:00Z'),
  config: itemSettings,
};

describe('API 請求設定服務', () => {
  let service: ApiRequestConfigService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiRequestConfigService,
      ],
    });
    service = TestBed.inject(ApiRequestConfigService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it.each([true, false])(
    '依契約使用 query parameter 檢查 ID，直接回傳 %s',
    async exists => {
      const result = firstValueFrom(service.exist(item.apiId));
      const request = http.expectOne(req => req.url === '/api-config/exist');
      expect(request.request.method).toBe('GET');
      expect(request.request.params.get('apiId')).toBe(item.apiId);
      expect(request.request.urlWithParams).toContain('%26');
      expect(request.request.urlWithParams).toContain('%23');
      request.flush(exists);
      expect(await result).toBe(exists);
    }
  );

  it('callApi 依契約傳送 json 並取得 HTTP Headers、狀態碼與 Body', async () => {
    const requestBody = {
      apiId: item.apiId,
      json: { id: 123, template: '{{$.id}}' },
    };
    const result = firstValueFrom(service.callApi(requestBody));
    const request = http.expectOne('/api-config/singalCallApi');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(requestBody);
    const body = [{ id: 123, enabled: true }];
    request.flush(body, { headers: { 'X-Test': ['a', 'b'] } });
    const response = await result;
    expect(response.status).toBe(200);
    expect(response.body).toEqual(body);
    expect(response.headers.getAll('X-Test')).toEqual(['a', 'b']);
    http.expectNone(req => req.url.startsWith('https://example.com'));
  });

  it('讀取清單時直接回傳後端資料，不轉換時間', async () => {
    const result = firstValueFrom(service.getAll());
    const response = [JSON.parse(JSON.stringify(item))];
    const request = http.expectOne('/api-config/all');
    expect(request.request.method).toBe('GET');
    request.flush(response);
    expect(await result).toEqual(response);
  });

  it('儲存設定不傳送後端時間，也不替換變數或呼叫目標 URL', async () => {
    const result = firstValueFrom(service.update(item));
    const request = http.expectOne('/api-config/update');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      apiId: item.apiId,
      description: item.description,
      config: {
        ...item.config,
        httpParams: item.config.httpParams.map(({ seq, ...row }) => row),
        bodyFormFields: item.config.bodyFormFields.map(
          ({ seq, ...row }) => row
        ),
      },
    });
    http.expectNone(req => req.url.startsWith('https://example.com'));
    request.flush(null);
    await result;
  });
});
