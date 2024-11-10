import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReplaceValueMap } from '../model';

@Injectable({ providedIn: 'root' })
export class ReplaceValueMapService {
  constructor(private readonly http: HttpClient) {}

  getNameList(): Observable<ReplaceValueMap[]> {
    return this.http.get<ReplaceValueMap[]>('/replace-value-map/name-list');
  }

  getByName(name: string): Observable<ReplaceValueMap> {
    return this.http.get<ReplaceValueMap>(
      `/replace-value-map/get?name=${name}`
    );
  }

  existMap(name: string): Observable<boolean> {
    return this.http.get<boolean>(`/replace-value-map/exist?name=${name}`);
  }

  update(req: ReplaceValueMap): Observable<void> {
    return this.http.post<void>('/replace-value-map/update', req);
  }

  deleteByName(name: string): Observable<void> {
    return this.http.delete<void>(`/replace-value-map/delete?name=${name}`);
  }
}
