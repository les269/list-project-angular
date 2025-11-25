import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ShareTag, ShareTagValue } from '../models';

@Injectable({ providedIn: 'root' })
export class ShareTagService {
  constructor(
    private readonly http: HttpClient,
    private store: Store
  ) {}

  getAllTag(): Observable<ShareTag[]> {
    return this.http.get<ShareTag[]>('/share-tag/all');
  }

  addTag(req: ShareTag): Observable<void> {
    return this.http.post<void>('/share-tag/add', req);
  }

  inUse(shareTagId: string): Observable<boolean> {
    return this.http.get<boolean>('/share-tag/in-use', {
      params: { shareTagId },
    });
  }

  deleteTag(shareTagId: string): Observable<void> {
    return this.http.delete<void>('/share-tag/delete', {
      params: { shareTagId },
    });
  }

  getShareTagValues(shareTagIds: string[]): Observable<ShareTagValue[]> {
    return this.http.post<ShareTagValue[]>(
      '/share-tag/value/by-ids',
      shareTagIds
    );
  }

  addTagValue(req: ShareTagValue): Observable<void> {
    return this.http.post<void>('/share-tag/value/add', req);
  }

  deleteTagValue(req: ShareTagValue): Observable<void> {
    return this.http.delete<void>('/share-tag/value/delete', {
      params: {
        shareTagId: req.shareTagId,
        value: req.value,
      },
    });
  }
}
