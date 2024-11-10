import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  CopyThemeRequest,
  ThemeCustomValue,
  ThemeCustomValueRequest,
  ThemeCustomValueResponse,
  ThemeHeader,
  ThemeTagValue,
  ThemeTagValueReq,
  ThemeTopCustom,
  ThemeTopCustomValue,
  ThemeTopCustomValueResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor(private readonly http: HttpClient) {}

  getAllTheme(): Observable<ThemeHeader[]> {
    return this.http.get<ThemeHeader[]>('/theme/all');
  }

  getByHeaderId(req: Partial<string>): Observable<ThemeHeader> {
    return this.http.get<ThemeHeader>(`/theme/id?headerId=${req}`);
  }

  findTheme(req: Partial<ThemeHeader>): Observable<ThemeHeader> {
    return this.http.post<ThemeHeader>('/theme/one', req);
  }

  existTheme(req: Partial<ThemeHeader>): Observable<boolean> {
    return this.http.post<boolean>('/theme/exist', req);
  }

  updateTheme(req: Partial<ThemeHeader>): Observable<void> {
    return this.http.post<void>('/theme/update', req);
  }

  deleteTheme(req: Partial<ThemeHeader>): Observable<void> {
    return this.http.post<void>('/theme/delete', req);
  }

  copyTheme(req: Partial<CopyThemeRequest>): Observable<void> {
    return this.http.post<void>('/theme/copy', req);
  }

  findCustomValue(
    req: ThemeCustomValueRequest
  ): Observable<ThemeCustomValueResponse> {
    return this.http.post<ThemeCustomValueResponse>('/theme/custom/value', req);
  }
  //更新custom value
  updateCustomValue(req: ThemeCustomValue): Observable<void> {
    return this.http.post<void>('/theme/custom/update', req);
  }

  //取得tag list
  getTagValueList(headerId: string): Observable<ThemeTagValue[]> {
    return this.http.get<ThemeTagValue[]>(
      `/theme/tag/value?headerId=${headerId}`
    );
  }
  //更新tag value
  updateTagValueList(req: ThemeTagValue[]): Observable<void> {
    return this.http.post<void>(`/theme/tag/update`, req);
  }

  findTopCustomValue(req: string): Observable<ThemeTopCustomValueResponse> {
    return this.http.get<ThemeTopCustomValueResponse>(
      `/theme/top-custom/value?headerId=${req}`
    );
  }

  updateTopCustomValue(req: ThemeTopCustomValue): Observable<void> {
    return this.http.post<void>('/theme/top-custom/update', req);
  }
}
