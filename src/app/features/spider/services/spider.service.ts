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
  previewExtractionWithFile(setting: SpiderItem, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const settingBlob = new Blob([JSON.stringify(setting)], {
      type: 'application/json',
    });
    formData.append('setting', settingBlob);
    return this.http.post<any>(
      `${this.prefix}/preview-extraction-with-file`,
      formData
    );
  }
}
