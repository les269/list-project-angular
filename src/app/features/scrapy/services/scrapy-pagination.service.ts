import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ScrapyPagination } from '../model';
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
}
