import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Dataset, DatasetData } from '../model/dataset.model';

@Injectable({ providedIn: 'root' })
export class DatasetService {
  constructor(private readonly http: HttpClient) {}

  findDataset(name: string): Observable<Dataset> {
    return this.http.get<Dataset>(`/dataset/get?name=${name}`);
  }

  findDatasetData(name: string): Observable<DatasetData> {
    return this.http.get<DatasetData>(`/dataset/getData?name=${name}`);
  }

  existDataset(name: string): Observable<boolean> {
    return this.http.get<boolean>(`/dataset/exist?name=${name}`);
  }

  getAllDataset(): Observable<Dataset[]> {
    return this.http.get<Dataset[]>('/dataset/all');
  }

  updateDataset(req: Partial<Dataset>): Observable<void> {
    return this.http.post<void>('/dataset/update', req);
  }

  deleteDataset(name: string): Observable<void> {
    return this.http.delete<void>(`/dataset/delete?name=${name}`);
  }
  refreshData(name: string): Observable<Dataset> {
    return this.http.get<Dataset>(`/dataset/refresh?name=${name}`);
  }
}