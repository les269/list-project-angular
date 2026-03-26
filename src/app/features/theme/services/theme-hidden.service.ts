import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ThemeHiddenTO } from '../models';
import { LayoutStore } from '../../../core/stores/layout.store';

@Injectable({ providedIn: 'root' })
export class ThemeHiddenService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<ThemeHiddenTO[]> {
    return this.http.get<ThemeHiddenTO[]>('/theme-hidden/all');
  }

  save(req: Pick<ThemeHiddenTO, 'headerId'>): Observable<void> {
    return this.http.post<void>('/theme-hidden/save', req);
  }

  delete(headerId: string): Observable<void> {
    return this.http.delete<void>(`/theme-hidden/delete?headerId=${headerId}`);
  }
}
