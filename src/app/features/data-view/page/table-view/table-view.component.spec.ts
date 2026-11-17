import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ListBaseViewStoreAdapter } from '../../stores/list-base-view.adapter';
import { TableViewComponent } from './table-view.component';

it('晚到與後續變更的配色會更新畫面，來源 row 與其他 consumer 不會被修改', async () => {
  const source = Object.freeze(
    [{ id: 'a' }, { id: 'b' }].map(row => Object.freeze(row))
  );
  const rows = signal(source);
  const colors = signal<string[]>([]);
  const otherConsumer = computed(() => rows().map(row => ({ ...row })));
  const store = {
    rowColor: colors,
    viewData: rows,
    defaultKey: signal('id'),
    headerId: signal('test'),
    themeDatasetList: signal([]),
    themeTagListForSelect: signal([]),
    themeTopCustomList: signal([]),
    themeCustomList: signal([]),
    searchValue: signal(''),
    filterAutoCompleteList: signal([]),
    currentPage: signal(1),
    totalLength: signal(2),
    pageSize: signal(30),
    sortKey: signal(''),
    ascFlag: signal(true),
    visibleLabelList: signal([]),
    checkVisibleByDataset: () => true,
  };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideTranslateService()],
  });
  TestBed.overrideComponent(TableViewComponent, {
    set: {
      providers: [{ provide: ListBaseViewStoreAdapter, useValue: store }],
    },
  });
  const fixture = TestBed.createComponent(TableViewComponent);
  await fixture.whenStable();
  expect(fixture.componentInstance.dataSource()).toEqual(source);
  colors.set(['red', 'blue']);
  await fixture.whenStable();
  expect(fixture.componentInstance.dataSource()).toEqual([
    { id: 'a', __color: 'red' },
    { id: 'b', __color: 'blue' },
  ]);
  expect(otherConsumer()).toEqual([{ id: 'a' }, { id: 'b' }]);
  const tableRows = () =>
    fixture.nativeElement.querySelectorAll(
      'tr.mat-row'
    ) as NodeListOf<HTMLTableRowElement>;
  expect(Array.from(tableRows(), row => row.style.backgroundColor)).toEqual([
    'red',
    'blue',
  ]);
  colors.set(['green']);
  await fixture.whenStable();
  expect(Array.from(tableRows(), row => row.style.backgroundColor)).toEqual([
    'green',
    'green',
  ]);
  colors.set([]);
  await fixture.whenStable();
  expect(fixture.componentInstance.dataSource()).toEqual(source);
  expect(otherConsumer()).toEqual([{ id: 'a' }, { id: 'b' }]);
});
