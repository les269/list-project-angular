import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { HeadersMapTO, HeadersMapType } from '../model';
import { Observable } from 'rxjs';

@Service()
export class HeadersMapService {
  readonly prefix = '/headers/map';
  readonly http = inject(HttpClient);

  isInUse(headersId: string, type: HeadersMapType): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/in-use?headersId=${encodeURIComponent(headersId)}&type=${encodeURIComponent(type)}`
    );
  }

  getByIdAndType(
    refId: string,
    type: HeadersMapType
  ): Observable<HeadersMapTO> {
    return this.http.get<HeadersMapTO>(
      `${this.prefix}/by-id-and-type?refId=${encodeURIComponent(refId)}&type=${encodeURIComponent(type)}`
    );
  }

  getByRefId(refId: string): Observable<HeadersMapTO[]> {
    return this.http.get<HeadersMapTO[]>(
      `${this.prefix}/by-ref-id?refId=${encodeURIComponent(refId)}`
    );
  }

  getByType(type: HeadersMapType): Observable<HeadersMapTO[]> {
    return this.http.get<HeadersMapTO[]>(
      `${this.prefix}/by-type?type=${encodeURIComponent(type)}`
    );
  }

  update(req: HeadersMapTO): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  delete(refId: string, type: HeadersMapType): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?refId=${encodeURIComponent(refId)}&type=${encodeURIComponent(type)}`
    );
  }

  headersIsInUse(headersId: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/headers-in-use?headersId=${encodeURIComponent(headersId)}`
    );
  }
}
