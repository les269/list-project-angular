import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Disk, DiskAddRequest } from '../model/disk.model';

@Injectable({ providedIn: 'root' })
export class DiskService {
  private readonly prefix = '/disk';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Disk[]> {
    return this.http.get<Disk[]>(`${this.prefix}/all`);
  }

  add(disk: string): Observable<void> {
    return this.http.post<void>(`${this.prefix}/add`, disk);
  }

  refresh(): Observable<void> {
    return this.http.get<void>(`${this.prefix}/refresh`);
  }

  delete(disk: string): Observable<void> {
    return this.http.post<void>(`${this.prefix}/delete`, disk);
  }
}
