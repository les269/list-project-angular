import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { SpiderItem } from '../model';

@Service()
export class SpiderItemService {
  readonly prefix = '/spider-item';
  readonly http = inject(HttpClient);

  getAll(): Observable<SpiderItem[]> {
    return this.http.get<SpiderItem[]>(`${this.prefix}/all`);
  }

  getBySpiderItemId(spiderItemId: string): Observable<SpiderItem> {
    return this.http.get<SpiderItem>(
      `${this.prefix}?spiderItemId=${encodeURIComponent(spiderItemId)}`
    );
  }

  update(req: SpiderItem): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  delete(spiderItemId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?spiderItemId=${encodeURIComponent(spiderItemId)}`
    );
  }

  isInUse(spiderItemId: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/in-use?spiderItemId=${encodeURIComponent(spiderItemId)}`
    );
  }

  getByIdList(spiderItemIdList: string[]): Observable<SpiderItem[]> {
    return this.http.post<SpiderItem[]>(
      `${this.prefix}/by-id-list`,
      spiderItemIdList
    );
  }
  getItemBySpiderId(spiderId: string): Observable<SpiderItem[]> {
    return this.http.get<SpiderItem[]>(
      `${this.prefix}/by-spider-id?spiderId=${encodeURIComponent(spiderId)}`
    );
  }
}
