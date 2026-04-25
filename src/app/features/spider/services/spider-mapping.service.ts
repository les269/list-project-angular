import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SpiderMapping } from '../model';

@Injectable({ providedIn: 'root' })
export class SpiderMappingService {
  readonly prefix = '/spider-mapping';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<SpiderMapping[]> {
    return this.http.get<SpiderMapping[]>(`${this.prefix}/all`);
  }

  getBySpiderId(spiderId: string): Observable<SpiderMapping[]> {
    return this.http.get<SpiderMapping[]>(
      `${this.prefix}/by-spider-id?spiderId=${encodeURIComponent(spiderId)}`
    );
  }

  getById(spiderId: string, executionOrder: number): Observable<SpiderMapping> {
    return this.http.get<SpiderMapping>(
      `${this.prefix}?spiderId=${encodeURIComponent(spiderId)}&executionOrder=${executionOrder}`
    );
  }

  update(req: SpiderMapping): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  updateList(req: SpiderMapping[]): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update-list`, req);
  }

  delete(
    spiderId: string,
    executionOrder: number,
    spiderItemId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?spiderId=${encodeURIComponent(spiderId)}&executionOrder=${executionOrder}&spiderItemId=${encodeURIComponent(spiderItemId)}`
    );
  }

  deleteBySpiderId(spiderId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete-by-spider-id?spiderId=${encodeURIComponent(spiderId)}`
    );
  }
  inUseBySpiderItemId(spiderItemId: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/in-use-by-spider-item-id?spiderItemId=${encodeURIComponent(spiderItemId)}`
    );
  }
}
