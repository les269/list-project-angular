import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieListMapTO, CookieListMapType, CookieListTO } from '../model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CookieListService {
  readonly prefix = '/cookie-list';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<CookieListTO[]> {
    return this.http.get<CookieListTO[]>(`${this.prefix}/all`);
  }

  getByCookieId(cookieId: string): Observable<CookieListTO> {
    return this.http.get<CookieListTO>(
      `${this.prefix}?cookieId=${encodeURIComponent(cookieId)}`
    );
  }

  update(req: CookieListTO): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  delete(cookieId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?cookieId=${encodeURIComponent(cookieId)}`
    );
  }

  isInUse(cookieId: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/in-use?cookieId=${encodeURIComponent(cookieId)}`
    );
  }

  getMapByRefId(refId: string): Observable<CookieListMapTO[]> {
    return this.http.get<CookieListMapTO[]>(
      `${this.prefix}/map/by-ref-id?refId=${encodeURIComponent(refId)}`
    );
  }

  getMapByType(type: CookieListMapType): Observable<CookieListMapTO[]> {
    return this.http.get<CookieListMapTO[]>(
      `${this.prefix}/map/by-type?type=${encodeURIComponent(type)}`
    );
  }

  updateMap(req: CookieListMapTO): Observable<void> {
    return this.http.post<void>(`${this.prefix}/map/update`, req);
  }

  deleteMap(refId: string, type: CookieListMapType): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/map/delete?refId=${encodeURIComponent(refId)}&type=${encodeURIComponent(type)}`
    );
  }
}
