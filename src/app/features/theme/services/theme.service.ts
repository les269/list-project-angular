import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CopyThemeRequest,
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
}
