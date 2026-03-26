export interface BaseSelectTableData<O> {
  displayedColumns: string[];
  labels: string[];
  dataSource: O[];
  selectType: 'single' | 'multiple';
  title?: string;
  selected?: O[];
  columnFormats?: Record<string, (value: any) => string>;
  columnSorts?: Record<string, boolean>;
  enableFilter?: boolean;
  showTitle?: boolean;
}
