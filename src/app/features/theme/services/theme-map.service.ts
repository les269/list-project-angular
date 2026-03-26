import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ThemeItemType, ThemeMapTO } from '../models';

@Injectable({ providedIn: 'root' })
export class ThemeMapService {
  private readonly http = inject(HttpClient);
  private readonly prefix = '/theme/item/map';

  updateItemMap(req: ThemeMapTO): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  deleteItemMap(
    type: ThemeItemType,
    itemId: string,
    headerId: string
  ): Observable<void> {
    return this.http.delete<void>(`${this.prefix}/delete`, {
      params: { type, itemId, headerId },
    });
  }

  itemMapInUse(type: ThemeItemType, itemId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.prefix}/in-use`, {
      params: { type, itemId },
    });
  }
}
