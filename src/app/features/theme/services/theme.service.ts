import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CopyThemeRequest,
  ThemeCustomValue,
  ThemeCustomValueRequest,
  ThemeCustomValueResponse,
  ThemeHeader,
  ThemeRequest,
  ThemeResponent,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor(private readonly http: HttpClient) {}

  getAllTheme(): Observable<ThemeHeader[]> {
    return this.http.get<ThemeHeader[]>('/theme/all');
  }

  getByHeaderId(req: Partial<string>): Observable<ThemeResponent> {
    return this.http.get<ThemeResponent>(`/theme/id?headerId=${req}`);
  }

  findTheme(req: Partial<ThemeHeader>): Observable<ThemeResponent> {
    return this.http.post<ThemeResponent>('/theme/one', req);
  }

  existTheme(req: Partial<ThemeHeader>): Observable<boolean> {
    return this.http.post<boolean>('/theme/exist', req);
  }

  updateTheme(req: Partial<ThemeRequest>): Observable<void> {
    return this.http.post<void>('/theme/update', req);
  }

  deleteTheme(req: Partial<ThemeHeader>): Observable<void> {
    return this.http.post<void>('/theme/delete', req);
  }
  copyTheme(req: Partial<CopyThemeRequest>): Observable<void> {
    return this.http.post<void>('/theme/copy', req);
  }
  findCustomValue(
    req: Partial<ThemeCustomValueRequest>
  ): Observable<ThemeCustomValueResponse> {
    return this.http.post<ThemeCustomValueResponse>('/theme/custom/value', req);
  }
  updateCustomValue(req: Partial<ThemeCustomValue>): Observable<void> {
    return this.http.post<void>('/theme/custom/update', req);
  }
}
