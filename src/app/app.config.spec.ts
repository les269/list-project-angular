import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TranslateLoader, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { appConfig } from './app.config';

describe('Translation configuration', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('loads the fallback language from assets and uses it for missing keys', async () => {
    const translate = TestBed.inject(TranslateService);
    http.expectOne('./assets/i18n/zh-tw.json').flush({ greeting: '你好' });

    const loaded = firstValueFrom(translate.use('en'));
    http.expectOne('./assets/i18n/en.json').flush({ title: 'Title' });
    await loaded;

    expect(translate.getFallbackLang()).toBe('zh-tw');
    expect(translate.getCurrentLang()).toBe('en');
    expect(translate.instant('greeting')).toBe('你好');
    expect(translate.instant('title')).toBe('Title');
  });

  it('propagates loader errors when a translation file is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = firstValueFrom(
      TestBed.inject(TranslateLoader).getTranslation('missing')
    );
    const rejected = expect(result).rejects.toMatchObject({ status: 404 });
    http.expectOne('./assets/i18n/missing.json').flush(null, {
      status: 404,
      statusText: 'Not Found',
    });
    await rejected;
  });
});
