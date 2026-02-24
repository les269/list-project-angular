import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, shareReplay } from 'rxjs';
import {
  CopyThemeRequest,
  ThemeCustomValue,
  ThemeCustomValueRequest,
  ThemeCustomValueResponse,
  ThemeHeader,
  ThemeHeaderType,
  ThemeTopCustomValue,
  ThemeTopCustomValueResponse,
} from '../models';
import { Store } from '@ngrx/store';
import { updateList } from '../../../shared/state/layout.actions';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  http = inject(HttpClient);
  store = inject(Store);

  getAllTheme(): Observable<ThemeHeader[]> {
    return this.http.get<ThemeHeader[]>('/theme/all');
  }

  getAllThemeMapType(): Observable<Record<ThemeHeaderType, ThemeHeader[]>> {
    return this.http.get<ThemeHeader[]>('/theme/all').pipe(
      map(res => ({
        [ThemeHeaderType.imageList]: res
          .filter(x => x.type === ThemeHeaderType.imageList)
          .sort((a, b) => (a.seq > b.seq ? 1 : -1)),
        [ThemeHeaderType.table]: res
          .filter(x => x.type === ThemeHeaderType.table)
          .sort((a, b) => (a.seq > b.seq ? 1 : -1)),
      }))
    );
  }

  updateAllTheme(): void {
    this.getAllThemeMapType()
      .pipe(
        map(res => {
          res.imageList = res.imageList.filter(
            x => x.themeOtherSetting.themeVisible
          );
          res.table = res.table.filter(x => x.themeOtherSetting.themeVisible);
          return res;
        })
      )
      .subscribe(res => {
        this.store.dispatch(updateList(res));
      });
  }

  updateThemeStore(req: Record<ThemeHeaderType, ThemeHeader[]>): void {
    const res = { ...req };
    res.imageList = req.imageList.filter(x => x.themeOtherSetting.themeVisible);
    res.table = req.table.filter(x => x.themeOtherSetting.themeVisible);
    this.store.dispatch(updateList(res));
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
    if (req.valueList.length === 0) {
      return of({});
    }
    return this.http.post<ThemeCustomValueResponse>('/theme/custom/value', req);
  }
  //更新custom value
  updateCustomValue(req: ThemeCustomValue): Observable<void> {
    return this.http.post<void>('/theme/custom/update', req);
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
