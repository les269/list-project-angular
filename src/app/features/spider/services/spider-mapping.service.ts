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

  delete(spiderId: string, executionOrder: number): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?spiderId=${encodeURIComponent(spiderId)}&executionOrder=${executionOrder}`
    );
  }

  deleteBySpiderId(spiderId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete-by-spider-id?spiderId=${encodeURIComponent(spiderId)}`
    );
  }
}
