import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GroupDatasetData } from '../model';

@Injectable({ providedIn: 'root' })
export class GroupDatasetDataService {
  prefix = '/group-dataset-data';
  constructor(private readonly http: HttpClient) {}

  getGroupDatasetData(
    groupName: string,
    primeValue: string
  ): Observable<GroupDatasetData> {
    return this.http.get<GroupDatasetData>(
      `${this.prefix}/get?groupName=${groupName}&primeValue=${encodeURIComponent(primeValue)}`
    );
  }

  existGroupDatasetData(
    groupName: string,
    primeValue: string
  ): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.prefix}/exist?groupName=${groupName}&primeValue=${encodeURIComponent(primeValue)}`
    );
  }

  getAllGroupDatasetData(groupName: string): Observable<GroupDatasetData[]> {
    return this.http.get<GroupDatasetData[]>(
      `${this.prefix}/all?groupName=${groupName}`
    );
  }
  getAllGroupDatasetDataOnlyPrimeValue(
    groupName: string
  ): Observable<GroupDatasetData[]> {
    return this.http.get<GroupDatasetData[]>(
      `${this.prefix}/all-only-prime-value?groupName=${encodeURIComponent(groupName)}`
    );
  }

  updateGroupDatasetData(req: Partial<GroupDatasetData>): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update`, req);
  }

  updateGroupDatasetDataList(
    req: Partial<GroupDatasetData[]>
  ): Observable<void> {
    return this.http.post<void>(`${this.prefix}/update-list`, req);
  }

  deleteGroupDatasetData(
    groupName: string,
    primeValue: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.prefix}/delete?groupName=${encodeURIComponent(groupName)}&primeValue=${encodeURIComponent(primeValue)}`
    );
  }

  deleteGroupDatasetDataForImage(
    groupName: string,
    primeValue: string
  ): Observable<string> {
    return this.http.delete(
      `${this.prefix}/delete-image?groupName=${groupName}&primeValue=${encodeURIComponent(primeValue)}`,
      { responseType: 'text' }
    );
  }
}
