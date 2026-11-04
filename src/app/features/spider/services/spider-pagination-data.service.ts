import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { SpiderPaginationData } from '../model';

@Service()
export class SpiderPaginationDataService {
  readonly prefix = '/spider-pagination-data';
  readonly http = inject(HttpClient);

  getAll(): Observable<SpiderPaginationData[]> {
    return this.http.get<SpiderPaginationData[]>(`${this.prefix}/all`);
  }

  getBySpiderPaginationId(
    spiderPaginationId: string
  ): Observable<SpiderPaginationData[]> {
    return this.http.get<SpiderPaginationData[]>(
      `${this.prefix}/by-spider-pagination-id?spiderPaginationId=${encodeURIComponent(spiderPaginationId)}`
    );
  }

  getById(
    spiderPaginationId: string,
    groupId: string,
    dataId: string
  ): Observable<SpiderPaginationData> {
    return this.http.get<SpiderPaginationData>(
      `${this.prefix}?spiderPaginationId=${encodeURIComponent(spiderPaginationId)}&groupId=${encodeURIComponent(groupId)}&dataId=${encodeURIComponent(dataId)}`
    );
  }

  update(req: SpiderPaginationData): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  delete(
    spiderPaginationId: string,
    groupId: string,
    dataId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?spiderPaginationId=${encodeURIComponent(spiderPaginationId)}&groupId=${encodeURIComponent(groupId)}&dataId=${encodeURIComponent(dataId)}`
    );
  }

  deleteBySpiderPaginationId(spiderPaginationId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete-by-spider-pagination-id?spiderPaginationId=${encodeURIComponent(spiderPaginationId)}`
    );
  }

  isInUse(
    spiderPaginationId: string,
    groupId: string,
    dataId: string
  ): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/in-use?spiderPaginationId=${encodeURIComponent(spiderPaginationId)}&groupId=${encodeURIComponent(groupId)}&dataId=${encodeURIComponent(dataId)}`
    );
  }
}
