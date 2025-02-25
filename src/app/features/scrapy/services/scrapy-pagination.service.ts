import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ScrapyPagination, ScrapyPaginationTest } from '../model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScrapyPaginationService {
  prefix = '/scrapy-pagination';
  constructor(private http: HttpClient) {}

  find(name: string): Observable<ScrapyPagination> {
    return this.http.get<ScrapyPagination>(`${this.prefix}/get?name=${name}`);
  }

  exist(name: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.prefix}/exist?name=${name}`);
  }

  getAll(): Observable<ScrapyPagination[]> {
    return this.http.get<ScrapyPagination[]>(`${this.prefix}/all`);
  }

  update(req: Partial<ScrapyPagination>): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  delete(name: string): Observable<void> {
    return this.http.delete<void>(`${this.prefix}/delete?name=${name}`);
  }

  testHtml(req: ScrapyPaginationTest): Observable<any> {
    return this.http.post(`${this.prefix}/test/html`, req);
  }

  updateRedirectData(name: string): Observable<ScrapyPagination> {
    return this.http.get<ScrapyPagination>(
      `${this.prefix}/update-redirect-data?name=${name}`
    );
  }
}
