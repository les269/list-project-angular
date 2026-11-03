import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable } from 'rxjs';
import { SpiderPagination } from '../model';

@Service()
export class SpiderPaginationService {
  readonly prefix = '/spider-pagination';
  readonly http = inject(HttpClient);

  getAll(): Observable<SpiderPagination[]> {
    return this.http.get<SpiderPagination[]>(`${this.prefix}/all`);
  }

  getById(spiderPaginationId: string): Observable<SpiderPagination> {
    return this.http
      .get<SpiderPagination>(
        `${this.prefix}?spiderPaginationId=${encodeURIComponent(spiderPaginationId)}`
      )
      .pipe(
        map(value => {
          // JSON 回傳的日期字串須在進入 Date 表單前還原。
          value.paginationConfig.paramSettings.forEach(param => {
            param.startTime = new Date(param.startTime);
            param.endTimeConfig.endTime = new Date(param.endTimeConfig.endTime);
          });
          value.paginationConfig.updateControl.lastUpdateDate = new Date(
            value.paginationConfig.updateControl.lastUpdateDate
          );
          return value;
        })
      );
  }

  update(req: SpiderPagination): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  delete(spiderPaginationId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?spiderPaginationId=${encodeURIComponent(spiderPaginationId)}`
    );
  }

  isInUse(spiderPaginationId: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/in-use?spiderPaginationId=${encodeURIComponent(spiderPaginationId)}`
    );
  }
}
