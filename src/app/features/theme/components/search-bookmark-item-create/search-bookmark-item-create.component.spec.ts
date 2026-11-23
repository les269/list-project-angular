import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { SearchBookmarkItem } from '../../models';
import { SearchBookmarkService } from '../../services/search-bookmark.service';
import { SearchBookmarkItemCreateComponent } from './search-bookmark-item-create.component';

describe('新增搜尋書籤資料', () => {
  async function setup() {
    const pending = new Subject<SearchBookmarkItem>();
    const updateItem = vi.fn(() => pending);
    const dialog = { close: vi.fn(), disableClose: false };
    TestBed.configureTestingModule({
      imports: [SearchBookmarkItemCreateComponent],
      providers: [
        provideTranslateService(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: { id: 'bookmark', value: 'draft' },
        },
        { provide: MatDialogRef, useValue: dialog },
        { provide: SearchBookmarkService, useValue: { updateItem } },
      ],
    });
    const fixture = TestBed.createComponent(SearchBookmarkItemCreateComponent);
    await fixture.whenStable();
    return {
      fixture,
      component: fixture.componentInstance,
      updateItem,
      dialog,
      pending,
    };
  }

  it('空白搜尋值不送出，表單不提供 seq 輸入欄位', async () => {
    const { fixture, component, updateItem } = await setup();
    component.model.set({ value: '  ' });
    component.save();
    expect(updateItem).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('input[type="number"]')
    ).toBeNull();
  });

  it('儲存中阻止重複送出與關閉，完成後回傳含 seq 的資料', async () => {
    const { component, updateItem, dialog, pending } = await setup();
    component.save();
    component.save();
    component.close();
    expect(updateItem).toHaveBeenCalledExactlyOnceWith({
      id: 'bookmark',
      value: 'draft',
    });
    expect(dialog.disableClose).toBe(true);
    expect(dialog.close).not.toHaveBeenCalled();
    const result = { id: 'bookmark', value: 'draft', seq: 3 };
    pending.next(result);
    pending.complete();
    expect(dialog.close).toHaveBeenCalledExactlyOnceWith(result);
    expect(component.isSaving()).toBe(false);
  });

  it('儲存失敗時保留輸入並恢復操作', async () => {
    const { component, dialog, pending } = await setup();
    component.save();
    pending.error(new Error('Request failed'));
    expect(component.model()).toEqual({ value: 'draft' });
    expect(component.isSaving()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(dialog.close).not.toHaveBeenCalled();
  });
});
