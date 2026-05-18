import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  SpiderItem,
  SpiderItemSetting,
  SpiderReq,
  SpiderTestReq,
} from '../model';

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

  previewExtraction(setting: SpiderItem): Observable<any> {
    return this.http.post<string>(`${this.prefix}/preview-extraction`, setting);
  }
}
