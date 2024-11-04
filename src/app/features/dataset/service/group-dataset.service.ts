import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GroupDataset } from '../model';

@Injectable({ providedIn: 'root' })
export class GroupDatasetService {
  constructor(private readonly http: HttpClient) {}

  getGroupDataset(name: string): Observable<GroupDataset> {
    return this.http.get<GroupDataset>(`/group-dataset/get?name=${name}`);
  }

  existGroupDataset(name: string): Observable<boolean> {
    return this.http.get<boolean>(`/group-dataset/exist?name=${name}`);
  }

  getAllGroupDataset(): Observable<GroupDataset[]> {
    return this.http.get<GroupDataset[]>('/group-dataset/all');
  }

  updateGroupDataset(req: Partial<GroupDataset>): Observable<void> {
    return this.http.post<void>('/group-dataset/update', req);
  }

  deleteGroupDataset(name: string): Observable<void> {
    return this.http.delete<void>(`/group-dataset/delete?name=${name}`);
  }
}
