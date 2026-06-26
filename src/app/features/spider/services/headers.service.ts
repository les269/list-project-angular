import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { HeadersMapType, HeadersTO } from '../model';
import { Observable } from 'rxjs';

@Service()
export class HeadersService {
  readonly prefix = '/headers';
  readonly http = inject(HttpClient);

  getByRefIdAndType(
    refId: string,
    type: HeadersMapType
  ): Observable<HeadersTO> {
    return this.http.get<HeadersTO>(
      `${this.prefix}/by-ref-id-and-type?refId=${encodeURIComponent(refId)}&type=${encodeURIComponent(type)}`
    );
  }

  getAll(): Observable<HeadersTO[]> {
    return this.http.get<HeadersTO[]>(`${this.prefix}/all`);
  }

  getByHeadersId(headersId: string): Observable<HeadersTO> {
    return this.http.get<HeadersTO>(
      `${this.prefix}?headersId=${encodeURIComponent(headersId)}`
    );
  }

  update(req: HeadersTO): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  delete(headersId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?headersId=${encodeURIComponent(headersId)}`
    );
  }
}
