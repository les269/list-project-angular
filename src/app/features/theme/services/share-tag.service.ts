import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
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

  inUse(shareTagId: string): Observable<string[]> {
    return this.http.get<string[]>('/share-tag/in-use', {
      params: { shareTagId },
    });
  }

  deleteTag(shareTagId: string): Observable<void> {
    return this.http.delete<void>('/share-tag/delete', {
      params: { shareTagId },
    });
  }
  getShareTagValue(shareTagId: string): Observable<ShareTagValue[]> {
    return this.http.get<ShareTagValue[]>('/share-tag/value/id', {
      params: { shareTagId },
    });
  }

  getShareTagValues(shareTagIds: string[]): Observable<ShareTagValue[]> {
    if (shareTagIds.length === 0) {
      return of([]); // return empty array if shareTagIds is empty to avoid unnecessary HTTP request
    }
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

  deleteShareTagValueList(req: {
    shareTagId: string;
    values: string[];
  }): Observable<void> {
    return this.http.delete<void>('/share-tag/value/delete-list', {
      body: req,
    });
  }
}
