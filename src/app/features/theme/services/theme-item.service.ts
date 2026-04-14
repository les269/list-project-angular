import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ThemeItemType,
  ThemeItemSummary,
  ThemeItem,
  ThemeItemMapping,
  CopyThemeItemReq,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ThemeItemService {
  private readonly http = inject(HttpClient);
  private readonly prefix = '/theme/item';

  getThemeItem<K extends ThemeItemType>(
    type: K,
    itemId: string
  ): Observable<ThemeItemMapping[K]> {
    return this.http.get<ThemeItemMapping[K]>(`${this.prefix}`, {
      params: { type, itemId },
    });
  }

  getAllItems(type: ThemeItemType): Observable<ThemeItemSummary[]> {
    return this.http.get<ThemeItemSummary[]>(`${this.prefix}/all`, {
      params: { type },
    });
  }

  getItemsByHeaderId(headerId: string): Observable<ThemeItem[]> {
    return this.http.get<ThemeItem[]>(`${this.prefix}/header-id`, {
      params: { headerId },
    });
  }

  getThemeItemByType<K extends ThemeItemType>(
    type: K
  ): Observable<ThemeItemMapping[K][]> {
    return this.http.get<ThemeItemMapping[K][]>(`${this.prefix}/by-type`, {
      params: { type },
    });
  }

  updateThemeItem(req: ThemeItem): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  deleteThemeItem(type: ThemeItemType, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.prefix}/delete`, {
      params: { type, itemId },
    });
  }
  copyThemeItem(req: CopyThemeItemReq): Observable<void> {
    return this.http.post<void>(`${this.prefix}/copy`, req);
  }
}
