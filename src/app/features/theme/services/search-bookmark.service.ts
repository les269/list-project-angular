import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import {
  SearchBookmark,
  SearchBookmarkItem,
  SearchBookmarkOrder,
} from '../models/search-bookmark.model';

@Service()
export class SearchBookmarkService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<SearchBookmark[]> {
    return this.http.get<SearchBookmark[]>('/search-bookmark/all');
  }

  getById(id: string): Observable<SearchBookmark> {
    return this.http.get<SearchBookmark>('/search-bookmark/get', {
      params: { id },
    });
  }

  update(req: Partial<SearchBookmark>): Observable<SearchBookmark> {
    return this.http.post<SearchBookmark>('/search-bookmark/update', req);
  }

  deleteById(id: string): Observable<void> {
    return this.http.delete<void>('/search-bookmark/delete', {
      params: { id },
    });
  }

  getAllItems(): Observable<SearchBookmarkItem[]> {
    return this.http.get<SearchBookmarkItem[]>('/search-bookmark/item/all');
  }

  getItemById(id: string): Observable<SearchBookmarkItem[]> {
    return this.http.get<SearchBookmarkItem[]>('/search-bookmark/item/get', {
      params: { id },
    });
  }

  updateItem(req: Partial<SearchBookmarkItem>): Observable<SearchBookmarkItem> {
    return this.http.post<SearchBookmarkItem>(
      '/search-bookmark/item/update',
      req
    );
  }

  deleteItemById(id: string, value: string): Observable<void> {
    return this.http.delete<void>('/search-bookmark/item/delete', {
      params: { id, value },
    });
  }

  updateItemOrder(req: SearchBookmarkOrder): Observable<SearchBookmarkItem[]> {
    return this.http.put<SearchBookmarkItem[]>(
      '/search-bookmark/item/order',
      req
    );
  }
}
