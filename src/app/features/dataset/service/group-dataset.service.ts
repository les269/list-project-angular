import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GroupDataset, GroupDatasetData } from '../model';

@Injectable({ providedIn: 'root' })
export class GroupDatasetService {
  prefix = '/group-dataset';
  constructor(private readonly http: HttpClient) {}

  getGroupDataset(groupName: string): Observable<GroupDataset> {
    return this.http.get<GroupDataset>(
      `${this.prefix}/get?groupName=${groupName}`
    );
  }

  existGroupDataset(groupName: string): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/exist?groupName=${groupName}`
    );
  }

  getAllGroupDataset(): Observable<GroupDataset[]> {
    return this.http.get<GroupDataset[]>(`${this.prefix}/all`);
  }

  updateGroupDataset(req: Partial<GroupDataset>): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  deleteGroupDataset(groupName: string): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?groupName=${groupName}`
    );
  }
}
