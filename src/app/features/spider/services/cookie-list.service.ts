import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { CookieListMapType, CookieListTO } from '../model';
import { Observable } from 'rxjs';

@Service()
export class CookieListService {
  readonly prefix = '/cookie-list';
  readonly http = inject(HttpClient);

  getByRefIdAndType(
    refId: string,
    type: CookieListMapType
  ): Observable<CookieListTO> {
    return this.http.get<CookieListTO>(
      `${this.prefix}/by-ref-id-and-type?refId=${encodeURIComponent(refId)}&type=${encodeURIComponent(type)}`
    );
  }
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
}
