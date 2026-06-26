import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { DatabaseConfig, TestConnectionResult } from '../model';
import { Observable } from 'rxjs';

@Service()
export class DatabaseConfigService {
  prefix = '/database-config';
  readonly http = inject(HttpClient);

  getAll(): Observable<DatabaseConfig[]> {
    return this.http.get<DatabaseConfig[]>(`${this.prefix}/all`);
  }
  testConnection(config: DatabaseConfig): Observable<TestConnectionResult> {
    return this.http.post<TestConnectionResult>(
      `${this.prefix}/test-connection`,
      config
    );
  }
  saveConfig(config: DatabaseConfig): Observable<void> {
    return this.http.post<void>(`${this.prefix}/save`, config);
  }
  deleteConfig(configId: string): Observable<void> {
    return this.http.delete<void>(`${this.prefix}/delete`, {
      params: { configId },
    });
  }
  openLocalFolder(configId: string): Observable<void> {
    return this.http.get<void>(
      `${this.prefix}/open-local-folder?configId=${configId}`
    );
  }
}
