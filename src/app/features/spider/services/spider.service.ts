import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import {
  SpiderItem,
  SpiderItemSetting,
  SpiderPaginationData,
  SpiderReq,
  SpiderTestReq,
} from '../model';

@Service()
export class SpiderService {
  readonly prefix = '/spider';
  readonly http = inject(HttpClient);

  // 回傳本次成功寫入的資料；force 可略過更新期限與間隔限制。
  executePagination(
    spiderPaginationId: string,
    force = false
  ): Observable<SpiderPaginationData[]> {
    return this.http.post<SpiderPaginationData[]>(
      `${this.prefix}/execute-pagination?spiderPaginationId=${encodeURIComponent(spiderPaginationId)}&force=${force}`,
      null
    );
  }

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
