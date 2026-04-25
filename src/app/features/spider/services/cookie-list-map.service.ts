import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieListMapTO, CookieListMapType } from '../model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CookieListMapService {
  readonly prefix = '/cookie-list/map';

  constructor(private readonly http: HttpClient) {}

  isInUse(cookieId: string, type: CookieListMapType): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/in-use?cookieId=${encodeURIComponent(cookieId)}&type=${encodeURIComponent(type)}`
    );
  }

  getByIdAndType(
    refId: string,
    type: CookieListMapType
  ): Observable<CookieListMapTO> {
    return this.http.get<CookieListMapTO>(
      `${this.prefix}/by-id-and-type?refId=${encodeURIComponent(refId)}&type=${encodeURIComponent(type)}`
    );
  }

  getByRefId(refId: string): Observable<CookieListMapTO[]> {
    return this.http.get<CookieListMapTO[]>(
      `${this.prefix}/by-ref-id?refId=${encodeURIComponent(refId)}`
    );
  }

  getByType(type: CookieListMapType): Observable<CookieListMapTO[]> {
    return this.http.get<CookieListMapTO[]>(
      `${this.prefix}/by-type?type=${encodeURIComponent(type)}`
    );
  }

  update(req: CookieListMapTO): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  delete(refId: string, type: CookieListMapType): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?refId=${encodeURIComponent(refId)}&type=${encodeURIComponent(type)}`
    );
  }

  cookieIsInUse(cookieId: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/cookie-in-use?cookieId=${encodeURIComponent(cookieId)}`
    );
  }
}
