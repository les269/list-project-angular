import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { ScrapyConfig, ScrapyReq, ScrapyTestReq } from '../model';

@Service()
export class ScrapyService {
  prefix = '/scrapy';
  readonly http = inject(HttpClient);

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

  testScrapyUrl(req: ScrapyTestReq): Observable<any> {
    return this.http.post(`${this.prefix}/test/url`, req);
  }

  testScrapyHtml(req: ScrapyTestReq): Observable<any> {
    return this.http.post(`${this.prefix}/test/html`, req);
  }

  testScrapyJson(req: ScrapyTestReq): Observable<any> {
    return this.http.post(`${this.prefix}/test/json`, req);
  }

  scrapyByUrl(req: ScrapyReq): Observable<any> {
    return this.http.post(`${this.prefix}/use-url`, req);
  }

  scrapyByJson(req: ScrapyReq): Observable<any> {
    return this.http.post(`${this.prefix}/use-json`, req);
  }
}
