import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Setting } from '../model';

@Injectable({ providedIn: 'root' })
export class SettingService {
  prefix = '/setting';
  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Setting[]> {
    return this.http.get<Setting[]>(`${this.prefix}/all`);
  }

  update(req: Setting): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  updateAll(req: Setting[]): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update/all`, req);
  }

  getByName(name: string): Observable<Setting> {
    return this.http.get<Setting>(`${this.prefix}/get-by-name`, {
      params: { name },
    });
  }

  changeDatabase(req: Setting): Observable<void> {
    return this.http.post<void>(`${this.prefix}/changeDatabase`, req);
  }
}
