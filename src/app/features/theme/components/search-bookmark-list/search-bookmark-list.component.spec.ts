import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SearchBookmark } from '../../models/search-bookmark.model';
import { SearchBookmarkService } from '../../services/search-bookmark.service';
import { SearchBookmarkListComponent } from './search-bookmark-list.component';
import { ThemeListComponent } from '../../pages/theme-list/theme-list.component';
import { ThemeService } from '../../services/theme.service';
import { LayoutStore } from '../../../../core/stores/layout.store';
import { provideRouter } from '@angular/router';
import { SearchBookmarkItemListComponent } from '../search-bookmark-item-list/search-bookmark-item-list.component';

describe('搜尋書籤管理', () => {
  async function setup() {
    const bookmarks = [{ id: 'shared', name: '共用搜尋' }];
    const pending = new Subject<SearchBookmark>();
    const service = {
      getAll: vi.fn(() => of(bookmarks)),
      update: vi.fn(() => pending),
      deleteById: vi.fn(() => of(undefined)),
    };
    const confirmation = new Subject<boolean>();
    const messageBox = { openI18N: vi.fn(() => confirmation) };
    const snackbar = { openI18N: vi.fn() };
    const dialog = { close: vi.fn(), disableClose: false };
    TestBed.configureTestingModule({
      imports: [SearchBookmarkListComponent],
      providers: [
        provideTranslateService(),
        { provide: SearchBookmarkService, useValue: service },
        { provide: MessageBoxService, useValue: messageBox },
        { provide: SnackbarService, useValue: snackbar },
        { provide: MatDialogRef, useValue: dialog },
      ],
    });
    const fixture = TestBed.createComponent(SearchBookmarkListComponent);
    await fixture.whenStable();
    return {
      fixture,
      component: fixture.componentInstance,
      page: fixture.nativeElement as HTMLElement,
      service,
      pending,
      snackbar,
      confirmation,
      dialog,
    };
  }

  it('新增時驗證空白及重複 ID，送出修剪後資料並阻止重複送出', async () => {
    const { fixture, component, service, pending, dialog, snackbar } =
      await setup();
    component.openCreate();
    component.bookmarkModel.set({ id: '  ', name: '  ' });
    component.save();
    expect(service.update).not.toHaveBeenCalled();
    component.bookmarkModel.set({ id: ' shared ', name: '重複' });
    component.save();
    expect(service.update).not.toHaveBeenCalled();
    expect(snackbar.openI18N).toHaveBeenCalledWith('searchBookmark.duplicate');
    component.bookmarkModel.set({ id: ' new ', name: ' 新搜尋 ' });
    component.save();
    component.save();
    component.close();
    expect(service.update).toHaveBeenCalledExactlyOnceWith({
      id: 'new',
      name: '新搜尋',
    });
    expect(dialog.close).not.toHaveBeenCalled();
    expect(dialog.disableClose).toBe(true);
    pending.next({ id: 'new', name: '新搜尋' });
    pending.complete();
    await fixture.whenStable();
    await vi.waitFor(() => expect(component.isEditing()).toBe(false));
    expect(component.isBusy()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('編輯保留 ID，儲存失敗時保留輸入並允許重試', async () => {
    const { fixture, component, page, service, pending, dialog } =
      await setup();
    page
      .querySelector<HTMLButtonElement>('[aria-label="g.edit 共用搜尋"]')!
      .click();
    await fixture.whenStable();
    expect(page.querySelector('form')).toBeNull();
    const editor = document.querySelector<HTMLElement>(
      '.cdk-overlay-container mat-dialog-container'
    )!;
    const fields = editor.querySelectorAll<HTMLInputElement>('form input');
    expect(fields[0].disabled).toBe(true);
    fields[1].value = '改名';
    fields[1].dispatchEvent(new Event('input'));
    await fixture.whenStable();
    editor
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    expect(service.update).toHaveBeenCalledWith({ id: 'shared', name: '改名' });
    pending.error(new Error('Request failed'));
    await fixture.whenStable();
    expect(component.bookmarkModel()).toEqual({ id: 'shared', name: '改名' });
    expect(component.isEditing()).toBe(true);
    expect(component.isBusy()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(editor.querySelector('form')).not.toBeNull();
  });

  it('新增在獨立 dialog 顯示，取消後清除輸入，再次開啟使用空白表單', async () => {
    const { fixture, component, page, service } = await setup();
    page.querySelector<HTMLButtonElement>('.toolbar .dialog-button')!.click();
    await fixture.whenStable();
    expect(page.querySelector('form')).toBeNull();
    const editor = document.querySelector<HTMLElement>(
      '.cdk-overlay-container mat-dialog-container'
    )!;
    expect(editor.textContent).toContain('searchBookmark.create');
    component.bookmarkModel.set({ id: 'draft', name: '未儲存' });
    editor
      .querySelector<HTMLButtonElement>(
        '.dialog-actions button[type="button"]'
      )!
      .click();
    await fixture.whenStable();
    await vi.waitFor(() => expect(component.isEditing()).toBe(false));
    expect(service.update).not.toHaveBeenCalled();
    component.openCreate();
    await fixture.whenStable();
    expect(component.bookmarkModel()).toEqual({ id: '', name: '' });
    expect(
      document.querySelectorAll('.cdk-overlay-container mat-dialog-container')
    ).toHaveLength(1);
  });

  it('刪除須先確認，取消時不呼叫刪除 API', async () => {
    const { fixture, component, service, confirmation } = await setup();
    component.deleteBookmark({ id: 'shared', name: '共用搜尋' });
    expect(service.deleteById).not.toHaveBeenCalled();
    confirmation.next(false);
    await fixture.whenStable();
    expect(service.deleteById).not.toHaveBeenCalled();
    expect(component.isBusy()).toBe(false);
    component.deleteBookmark({ id: 'shared', name: '共用搜尋' });
    confirmation.next(true);
    await fixture.whenStable();
    expect(service.deleteById).toHaveBeenCalledExactlyOnceWith('shared');
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('可依 ID 或名稱篩選清單', async () => {
    const { fixture, component, page } = await setup();
    component.filterValue.set(' SHARED ');
    await fixture.whenStable();
    expect(page.querySelector('tbody')!.textContent).toContain('共用搜尋');
    component.filterValue.set('不存在');
    await fixture.whenStable();
    expect(page.querySelector('tbody')!.textContent).not.toContain('共用搜尋');
    expect(page.querySelector('.empty-row')).not.toBeNull();
  });

  it('編輯旁的 list 按鈕將該列書籤傳給資料清單 dialog', async () => {
    const { page, fixture } = await setup();
    const open = vi
      .spyOn(fixture.debugElement.injector.get(MatDialog), 'open')
      .mockReturnValue({} as MatDialogRef<SearchBookmarkItemListComponent>);
    const edit = page.querySelector<HTMLButtonElement>(
      '[aria-label="g.edit 共用搜尋"]'
    )!;
    const list = edit.nextElementSibling as HTMLButtonElement;
    expect(list.querySelector('mat-icon')!.textContent).toBe('list');
    list.click();
    expect(open).toHaveBeenCalledWith(
      SearchBookmarkItemListComponent,
      expect.objectContaining({ data: { id: 'shared', name: '共用搜尋' } })
    );
  });

  it('theme 清單在共享標籤按鈕旁開啟搜尋書籤管理', async () => {
    const dialog = { open: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ThemeListComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: MatDialog, useValue: dialog },
        { provide: ThemeService, useValue: {} },
        { provide: SnackbarService, useValue: {} },
        { provide: MessageBoxService, useValue: {} },
        {
          provide: LayoutStore,
          useValue: { visibleList: () => ({ table: [], imageList: [] }) },
        },
      ],
    });
    const fixture = TestBed.createComponent(ThemeListComponent);
    await fixture.whenStable();
    const actions = (
      fixture.nativeElement as HTMLElement
    ).querySelectorAll<HTMLButtonElement>('.secondary-actions button');
    expect(actions[1].textContent).toContain('home.shareTagList');
    expect(actions[2].textContent).toContain('searchBookmark.title');
    actions[2].click();
    expect(dialog.open).toHaveBeenCalledWith(
      SearchBookmarkListComponent,
      expect.objectContaining({ width: '800px' })
    );
  });
});
