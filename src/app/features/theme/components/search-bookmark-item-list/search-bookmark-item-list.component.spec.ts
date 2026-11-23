import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SearchBookmarkService } from '../../services/search-bookmark.service';
import { SearchBookmarkItemListComponent } from './search-bookmark-item-list.component';
import { SearchBookmarkItem } from '../../models';

describe('搜尋書籤資料清單', () => {
  function drop(
    fixture: ComponentFixture<SearchBookmarkItemListComponent>,
    previousIndex: number,
    currentIndex: number
  ) {
    const list = fixture.debugElement.query(By.directive(CdkDropList));
    list.triggerEventHandler('cdkDropListDropped', {
      previousIndex,
      currentIndex,
      container: { data: list.injector.get(CdkDropList).data },
    });
  }
  async function setup() {
    const item = { id: 'bookmark & 1', value: '搜尋內容', seq: 0 };
    const confirmation = new Subject<boolean>();
    const deletion = new Subject<void>();
    const orderUpdate = new Subject<SearchBookmarkItem[]>();
    const service = {
      getItemById: vi.fn(() => of([item])),
      deleteItemById: vi.fn(() => deletion),
      updateItemOrder: vi.fn(() => orderUpdate),
    };
    const snackbar = { openI18N: vi.fn() };
    const dialog = { close: vi.fn(), disableClose: false };
    TestBed.configureTestingModule({
      imports: [SearchBookmarkItemListComponent],
      providers: [
        provideTranslateService(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: { id: item.id, name: '目前書籤' },
        },
        { provide: MatDialogRef, useValue: dialog },
        { provide: SearchBookmarkService, useValue: service },
        {
          provide: MessageBoxService,
          useValue: { openI18N: () => confirmation },
        },
        { provide: SnackbarService, useValue: snackbar },
      ],
    });
    const fixture = TestBed.createComponent(SearchBookmarkItemListComponent);
    await fixture.whenStable();
    return {
      fixture,
      component: fixture.componentInstance,
      page: fixture.nativeElement as HTMLElement,
      item,
      service,
      confirmation,
      deletion,
      orderUpdate,
      snackbar,
      dialog,
    };
  }

  it('使用選取書籤的 id 讀取資料，顯示內容並可篩選', async () => {
    const { fixture, component, page, service } = await setup();
    expect(service.getItemById).toHaveBeenCalledExactlyOnceWith('bookmark & 1');
    expect(page.querySelector('h2')!.textContent).toContain('目前書籤');
    expect(page.querySelector('tbody')!.textContent).toContain('搜尋內容');
    component.filterValue.set('不存在');
    await fixture.whenStable();
    expect(page.querySelector('.empty-row')).not.toBeNull();
    component.filterValue.set(' 搜尋 ');
    await fixture.whenStable();
    expect(page.querySelector('tbody')!.textContent).toContain('搜尋內容');
  });

  it('確認後刪除該筆 id，阻止重複刪除並更新空清單', async () => {
    const {
      fixture,
      component,
      page,
      service,
      confirmation,
      deletion,
      snackbar,
      dialog,
    } = await setup();
    page.querySelector<HTMLButtonElement>('tbody .row-action-danger')!.click();
    expect(service.deleteItemById).not.toHaveBeenCalled();
    confirmation.next(true);
    component.deleteItem({ id: 'another', value: '另一筆', seq: 0 });
    component.close();
    expect(service.deleteItemById).toHaveBeenCalledExactlyOnceWith(
      'bookmark & 1',
      '搜尋內容'
    );
    expect(dialog.close).not.toHaveBeenCalled();
    expect(dialog.disableClose).toBe(true);
    service.getItemById.mockReturnValue(of([]));
    deletion.next();
    deletion.complete();
    await fixture.whenStable();
    expect(page.querySelector('.empty-row')).not.toBeNull();
    expect(component.isDeleting()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(snackbar.openI18N).toHaveBeenCalledWith('msg.deleteSuccess');
    expect(service.getItemById).toHaveBeenCalledTimes(2);
  });

  it('同 id 多筆資料可依 value 逐筆刪除，重新載入後保留其餘資料', async () => {
    const { fixture, component, page, service, item, confirmation, deletion } =
      await setup();
    service.getItemById.mockReturnValue(
      of([item, { ...item, value: '另一個搜尋值' }])
    );
    component.items.reload();
    await fixture.whenStable();
    expect(page.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(page.querySelector('tbody')!.textContent).toContain('另一個搜尋值');
    expect(
      Array.from(
        page.querySelectorAll<HTMLButtonElement>('tbody button')
      ).every(button => !button.disabled)
    ).toBe(true);
    page
      .querySelectorAll<HTMLButtonElement>('tbody .row-action-danger')[1]
      .click();
    confirmation.next(true);
    expect(service.deleteItemById).toHaveBeenCalledExactlyOnceWith(
      item.id,
      '另一個搜尋值'
    );
    service.getItemById.mockReturnValue(of([item]));
    deletion.next();
    deletion.complete();
    await fixture.whenStable();
    expect(page.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(page.querySelector('tbody')!.textContent).toContain(item.value);
    expect(page.querySelector('tbody')!.textContent).not.toContain(
      '另一個搜尋值'
    );
    service.getItemById.mockReturnValue(of([]));
    component.items.reload();
    await fixture.whenStable();
    expect(page.querySelector('.empty-row')).not.toBeNull();
  });

  it('取消刪除保留資料，不呼叫刪除 API', async () => {
    const { fixture, component, service, confirmation, item } = await setup();
    component.deleteItem(item);
    confirmation.next(false);
    await fixture.whenStable();
    expect(service.deleteItemById).not.toHaveBeenCalled();
    expect(component.dataSource.filteredData).toEqual([item]);
    expect(component.isDeleting()).toBe(false);
  });

  it('最前方 icon 可拖曳調整本地順序，篩選後儲存仍送出完整清單一次', async () => {
    const { fixture, component, page, service, item, orderUpdate, dialog } =
      await setup();
    const second = { ...item, value: 'second', seq: 5 };
    const third = { ...item, value: 'third', seq: 9 };
    service.getItemById.mockReturnValue(of([third, item, second]));
    component.items.reload();
    await fixture.whenStable();
    expect(page.querySelectorAll('thead th')[1].textContent).toContain(
      'searchBookmark.seq'
    );
    expect(page.querySelectorAll('tbody td')[1].textContent?.trim()).toBe('0');
    const handle = fixture.debugElement.query(By.directive(CdkDragHandle));
    expect(handle.nativeElement.tagName).toBe('MAT-ICON');
    const firstCell = page.querySelector('tbody td')!;
    expect(firstCell.querySelector('button')).toBeNull();
    expect(firstCell.querySelector('mat-icon')).not.toBeNull();
    drop(fixture, 2, 0);
    await fixture.whenStable();
    expect(component.orderedItems().map(value => value.value)).toEqual([
      'third',
      item.value,
      'second',
    ]);
    expect(component.dataSource.filteredData[0].seq).toBe(0);
    expect(service.updateItemOrder).not.toHaveBeenCalled();
    expect(component.hasOrderChanges()).toBe(true);
    component.filterValue.set('third');
    await fixture.whenStable();
    page.querySelector<HTMLButtonElement>('.save-order')!.click();
    component.saveOrder();
    expect(service.updateItemOrder).toHaveBeenCalledExactlyOnceWith({
      id: item.id,
      values: ['third', item.value, 'second'],
    });
    expect(dialog.disableClose).toBe(true);
    const saved = [
      { ...third, seq: 1 },
      { ...item, seq: 2 },
      { ...second, seq: 3 },
    ];
    orderUpdate.next(saved);
    orderUpdate.complete();
    await fixture.whenStable();
    expect(component.hasOrderChanges()).toBe(false);
    expect(component.orderedItems()).toEqual(saved);
    expect(component.isSavingOrder()).toBe(false);
    expect(dialog.disableClose).toBe(false);
  });

  it('更新順序失敗時保留草稿，還原不呼叫 API', async () => {
    const { fixture, component, service, item, orderUpdate, dialog } =
      await setup();
    const second = { ...item, value: 'second', seq: 1 };
    service.getItemById.mockReturnValue(of([item, second]));
    component.items.reload();
    await fixture.whenStable();
    drop(fixture, 0, 0);
    expect(component.hasOrderChanges()).toBe(false);
    drop(fixture, 0, 1);
    expect(component.orderedItems().map(value => value.value)).toEqual([
      'second',
      item.value,
    ]);
    component.saveOrder();
    orderUpdate.error(new Error('Request failed'));
    await fixture.whenStable();
    expect(component.hasOrderChanges()).toBe(true);
    expect(component.isSavingOrder()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    component.resetOrder();
    expect(component.orderedItems()).toEqual([item, second]);
    expect(component.hasOrderChanges()).toBe(false);
    expect(service.updateItemOrder).toHaveBeenCalledTimes(1);
  });

  it.each(['seq', 'id', 'value', 'updatedTime'])(
    '%s 欄位排序僅影響顯示，其他排序與序號降冪禁止拖曳',
    async column => {
      const { fixture, component, page, service, item } = await setup();
      const first = {
        ...item,
        id: 'a',
        value: 'Alpha',
        seq: 0,
        updatedTime: '2026-01-01T00:00:00Z',
      };
      const second = {
        ...item,
        id: 'b',
        value: 'Beta',
        seq: 5,
        updatedTime: '2026-02-01T00:00:00Z',
      };
      service.getItemById.mockReturnValue(of([second, first]));
      component.items.reload();
      await fixture.whenStable();
      const header = page.querySelector<HTMLElement>(
        `[mat-sort-header="${column}"]`
      )!;
      const displayedValues = () =>
        Array.from(page.querySelectorAll('tbody .item-value'), cell =>
          cell.textContent?.trim()
        );
      if (column !== 'seq') {
        header.click();
        await fixture.whenStable();
        expect(displayedValues()).toEqual(['Alpha', 'Beta']);
        expect(component.canDrag()).toBe(false);
        drop(fixture, 0, 1);
      }
      header.click();
      await fixture.whenStable();
      expect(displayedValues()).toEqual(['Beta', 'Alpha']);
      expect(component.canDrag()).toBe(false);
      expect(
        fixture.debugElement
          .query(By.directive(CdkDropList))
          .injector.get(CdkDropList).disabled
      ).toBe(true);
      drop(fixture, 0, 1);
      component.saveOrder();
      expect(component.orderedItems()).toEqual([first, second]);
      expect(component.hasOrderChanges()).toBe(false);
      expect(service.updateItemOrder).not.toHaveBeenCalled();
      const seqHeader = page.querySelector<HTMLElement>(
        '[mat-sort-header="seq"]'
      )!;
      seqHeader.click();
      await fixture.whenStable();
      expect(component.canDrag()).toBe(true);
      expect(displayedValues()).toEqual(['Alpha', 'Beta']);
    }
  );

  it('有順序草稿時鎖定欄位排序，重設後恢復排序', async () => {
    const { fixture, component, page, service, item } = await setup();
    const second = { ...item, value: 'second', seq: 5 };
    service.getItemById.mockReturnValue(of([item, second]));
    component.items.reload();
    await fixture.whenStable();
    drop(fixture, 0, 1);
    await fixture.whenStable();
    const header = page.querySelector<HTMLElement>(
      '[mat-sort-header="value"]'
    )!;
    header.click();
    component.changeSort({ active: 'value', direction: 'asc' });
    await fixture.whenStable();
    expect(component.sort()).toEqual({ active: 'seq', direction: 'asc' });
    expect(component.orderedItems().map(entry => entry.value)).toEqual([
      'second',
      item.value,
    ]);
    expect(
      fixture.debugElement.query(By.directive(MatSort)).injector.get(MatSort)
        .disabled
    ).toBe(true);
    component.resetOrder();
    await fixture.whenStable();
    header.click();
    await fixture.whenStable();
    expect(component.sort()).toEqual({ active: 'value', direction: 'asc' });
    expect(component.hasOrderChanges()).toBe(false);
    expect(service.updateItemOrder).not.toHaveBeenCalled();
  });

  it('篩選時拖曳只交換可見資料，隱藏資料保留原位置', async () => {
    const { fixture, component, service, item } = await setup();
    const visibleFirst = { ...item, value: 'visible first', seq: 0 };
    const hidden = { ...item, value: 'hidden', seq: 1 };
    const visibleLast = { ...item, value: 'visible last', seq: 2 };
    service.getItemById.mockReturnValue(
      of([visibleFirst, hidden, visibleLast])
    );
    component.items.reload();
    component.filterValue.set('visible');
    await fixture.whenStable();
    drop(fixture, 1, 0);
    await fixture.whenStable();
    expect(component.orderedItems().map(value => value.value)).toEqual([
      'visible last',
      'hidden',
      'visible first',
    ]);
    expect(service.updateItemOrder).not.toHaveBeenCalled();
  });

  it('刪除失敗保留資料並恢復操作', async () => {
    const {
      fixture,
      component,
      confirmation,
      deletion,
      item,
      dialog,
      snackbar,
    } = await setup();
    component.deleteItem(item);
    confirmation.next(true);
    deletion.error(new Error('Request failed'));
    await fixture.whenStable();
    expect(component.dataSource.filteredData).toEqual([item]);
    expect(component.isDeleting()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(snackbar.openI18N).not.toHaveBeenCalled();
  });
});
