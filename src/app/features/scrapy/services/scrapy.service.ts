import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HtmlRequest, ScrapyConfig, ScrapyData, ScrapyTestReq } from '../model';

@Injectable({ providedIn: 'root' })
export class ScrapyService {
  constructor(private readonly http: HttpClient) {}

  findConfig(name: string): Observable<ScrapyConfig> {
    return this.http.get<ScrapyConfig>(`/scrapy/get?name=${name}`);
  }

  existConfig(name: string): Observable<boolean> {
    return this.http.get<boolean>(`/scrapy/exist?name=${name}`);
  }

  getAllConfig(): Observable<ScrapyConfig[]> {
    return this.http.get<ScrapyConfig[]>('/scrapy/all');
  }

  getAllName(): Observable<string[]> {
    return this.http.get<string[]>('/scrapy/allName');
  }

  updateConfig(req: Partial<ScrapyConfig>): Observable<void> {
    return this.http.post<void>('/scrapy/update', req);
  }

  deleteConfig(name: string): Observable<void> {
    return this.http.delete<void>(`/scrapy/delete?name=${name}`);
  }

  testScrapyHtml(req: ScrapyTestReq): Observable<any> {
    return this.http.post('/scrapy/test/html', req);
  }

  testScrapyJson(req: ScrapyTestReq): Observable<any> {
    return this.http.post('/scrapy/test/json', req);
  }
  testScrapyUrl(req: ScrapyTestReq): Observable<any> {
    return this.http.post('/scrapy/test/url', req);
  }
}
