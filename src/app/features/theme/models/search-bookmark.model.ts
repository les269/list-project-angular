export interface SearchBookmark {
  id: string;
  name: string;
  createdTime?: string;
  updatedTime?: string;
}

export interface SearchBookmarkItem {
  id: string;
  value: string;
  seq: number;
  createdTime?: string;
  updatedTime?: string;
}

export interface SearchBookmarkOrder {
  id: string;
  values: string[];
}
