import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SpiderConfig } from '../model';

@Injectable({ providedIn: 'root' })
export class SpiderConfigService {
  readonly prefix = '/spider-config';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<SpiderConfig[]> {
    return this.http.get<SpiderConfig[]>(`${this.prefix}/all`);
  }

  getBySpiderId(spiderId: string): Observable<SpiderConfig> {
    return this.http.get<SpiderConfig>(
      `${this.prefix}?spiderId=${encodeURIComponent(spiderId)}`
    );
  }

  update(req: SpiderConfig): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  delete(spiderId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?spiderId=${encodeURIComponent(spiderId)}`
    );
  }

  isInUse(spiderId: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/in-use?spiderId=${encodeURIComponent(spiderId)}`
    );
  }
}
