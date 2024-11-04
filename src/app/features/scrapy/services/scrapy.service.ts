import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HtmlRequest, ScrapyConfig, ScrapyData, ScrapyTestReq } from '../model';

@Injectable({ providedIn: 'root' })
export class ScrapyService {
  prefix = '/scrapy';
  constructor(private readonly http: HttpClient) {}

  findConfig(name: string): Observable<ScrapyConfig> {
    return this.http.get<ScrapyConfig>(`${this.prefix}/get?name=${name}`);
  }

  existConfig(name: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.prefix}/exist?name=${name}`);
  }

  getAllConfig(): Observable<ScrapyConfig[]> {
    return this.http.get<ScrapyConfig[]>(`${this.prefix}/all`);
  }

  getAllName(): Observable<string[]> {
    return this.http.get<string[]>(`${this.prefix}/allName`);
  }

  getByNameList(req: string[]): Observable<ScrapyConfig[]> {
    return this.http.post<ScrapyConfig[]>(`${this.prefix}/by-name-list`, req);
  }

  updateConfig(req: Partial<ScrapyConfig>): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  deleteConfig(name: string): Observable<void> {
    return this.http.delete<void>(`${this.prefix}/delete?name=${name}`);
  }

  testScrapyHtml(req: ScrapyTestReq): Observable<any> {
    return this.http.post(`${this.prefix}/test/html`, req);
  }

  testScrapyJson(req: ScrapyTestReq): Observable<any> {
    return this.http.post(`${this.prefix}/test/json`, req);
  }
  testScrapyUrl(req: ScrapyTestReq): Observable<any> {
    return this.http.post(`${this.prefix}/test/url`, req);
  }
}
