import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FileExistRequest, FileRequest } from '../model/file.model';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileService {
  constructor(private readonly http: HttpClient) {}

  delete(req: FileRequest): Observable<boolean> {
    return this.http.post<boolean>('/file/delete', req);
  }
  moveTo(req: FileRequest): Observable<boolean> {
    return this.http.post<boolean>('/file/move-to', req);
  }
  fileExist(req: FileExistRequest[]): Observable<Record<string, boolean>> {
    if (req.length === 0) return of({});
    return this.http.post<Record<string, boolean>>('/file/file-exist', req);
  }
  openFolder(req: FileRequest): Observable<boolean> {
    return this.http.post<boolean>('/file/open-file', req);
  }
}
