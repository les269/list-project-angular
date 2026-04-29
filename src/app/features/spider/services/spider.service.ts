import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SpiderItemSetting, SpiderReq, SpiderTestReq } from '../model';

@Injectable({ providedIn: 'root' })
export class SpiderService {
  readonly prefix = '/spider';

  constructor(private readonly http: HttpClient) {}

  executeByUrl(req: SpiderReq): Observable<any> {
    return this.http.post<string>(`${this.prefix}/use-url`, req);
  }

  executeByPrimeKeyList(req: SpiderReq): Observable<any> {
    return this.http.post<string>(`${this.prefix}/use-prime-key`, req);
  }

  previewExtraction(setting: SpiderItemSetting): Observable<any> {
    return this.http.post<string>(`${this.prefix}/preview-extraction`, setting);
  }

  previewByUrl(req: SpiderTestReq): Observable<any> {
    return this.http.post<string>(`${this.prefix}/preview/use-url`, req);
  }

  previewByPrimeKey(req: SpiderTestReq): Observable<any> {
    return this.http.post<string>(`${this.prefix}/preview/use-prime-key`, req);
  }
}
