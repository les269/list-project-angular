import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideTranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { SearchBookmarkService } from '../../../theme/services/search-bookmark.service';
import { SearchBookmarkButtonComponent } from './search-bookmark-button.component';
import { SearchBookmarkItem } from '../../../theme/models';

describe('圖片清單搜尋書籤', () => {
  async function setup() {
    const getItemById = vi.fn(() =>
      of([
        { id: 'bookmark', value: '保留搜尋值', seq: 1 },
        { id: 'bookmark', value: '另一個搜尋值', seq: 2 },
      ])
    );
    const updateItem = vi.fn((item: Pick<SearchBookmarkItem, 'id' | 'value'>) =>
      of({ ...item, seq: 42 })
    );
    TestBed.configureTestingModule({
      imports: [SearchBookmarkButtonComponent],
      providers: [
        provideTranslateService(),
        {
          provide: SearchBookmarkService,
          useValue: { getItemById, updateItem },
        },
      ],
    });
    const fixture = TestBed.createComponent(SearchBookmarkButtonComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      page,
      component: fixture.componentInstance,
      getItemById,
      updateItem,
    };
  }

  it('未設定書籤時不顯示按鈕，也不查詢 API', async () => {
    const { fixture, page, component, getItemById } = await setup();
    expect(page.querySelector('button')).toBeNull();
    fixture.componentRef.setInput('bookmarkId', '  ');
    await fixture.whenStable();
    component.toggle();
    expect(page.querySelector('button')).toBeNull();
    expect(getItemById).not.toHaveBeenCalled();
  });

  it('點擊面板內部保留面板，點擊外部收合', async () => {
    const { fixture, page, component } = await setup();
    fixture.componentRef.setInput('bookmarkId', 'bookmark');
    await fixture.whenStable();
    page.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    document.querySelector<HTMLElement>('.search-bookmark-panel h2')!.click();
    expect(component.isOpen()).toBe(true);
    document.body.click();
    await vi.waitFor(() => expect(component.isOpen()).toBe(false));
  });

  it('新增 dialog 預填目前搜尋值，不傳 seq，儲存後重新讀取清單', async () => {
    const { fixture, page, component, getItemById, updateItem } = await setup();
    getItemById.mockReturnValueOnce(
      of([
        { id: 'bookmark', value: 'first', seq: 9 },
        { id: 'bookmark', value: 'second', seq: 2 },
      ])
    );
    fixture.componentRef.setInput('bookmarkId', 'bookmark');
    fixture.componentRef.setInput('searchValue', '目前的搜尋值');
    await fixture.whenStable();
    page.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    document
      .querySelector<HTMLButtonElement>('.search-bookmark-panel .add-button')!
      .click();
    await fixture.whenStable();
    const dialog = document.querySelector<HTMLElement>('mat-dialog-container')!;
    const value = dialog.querySelector<HTMLInputElement>('input[type="text"]')!;
    expect(value.value).toBe('目前的搜尋值');
    expect(dialog.querySelector('input[type="number"]')).toBeNull();
    value.click();
    expect(component.isOpen()).toBe(true);
    dialog
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    expect(updateItem).toHaveBeenCalledExactlyOnceWith({
      id: 'bookmark',
      value: '目前的搜尋值',
    });
    await vi.waitFor(() => expect(getItemById).toHaveBeenCalledTimes(2));
    expect(component.isOpen()).toBe(true);
  });

  it('標題旁依序顯示新增與設定 icon，設定開啟該書籤的管理清單', async () => {
    const { fixture, page, component, getItemById } = await setup();
    fixture.componentRef.setInput('bookmarkId', 'bookmark');
    await fixture.whenStable();
    page.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    const header = document.querySelector<HTMLElement>(
      '.search-bookmark-panel header'
    )!;
    const icons = Array.from(header.querySelectorAll('button mat-icon'), icon =>
      icon.textContent?.trim()
    );
    expect(icons).toEqual(['add', 'settings', 'close']);
    header.querySelector<HTMLButtonElement>('.config-button')!.click();
    await fixture.whenStable();
    expect(
      document.querySelector(
        'mat-dialog-container app-search-bookmark-item-list'
      )
    ).not.toBeNull();
    expect(getItemById).toHaveBeenLastCalledWith('bookmark');
    await vi.waitFor(() => expect(component.isOpen()).toBe(false));
  });

  it('點擊後在右側開啟 snackbar，依設定 ID 載入並可選取搜尋', async () => {
    const { fixture, page, component, getItemById } = await setup();
    const selected = vi.fn();
    component.search.subscribe(selected);
    fixture.componentRef.setInput('bookmarkId', 'bookmark');
    await fixture.whenStable();
    expect(getItemById).not.toHaveBeenCalled();
    const snackbar = fixture.debugElement.injector.get(MatSnackBar);
    const open = vi.spyOn(snackbar, 'openFromComponent');
    page.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        horizontalPosition: 'right',
        panelClass: 'search-bookmark-panel',
        duration: 0,
        data: expect.objectContaining({ id: 'bookmark' }),
      })
    );
    expect(getItemById).toHaveBeenCalledExactlyOnceWith('bookmark');
    expect(page.querySelector('button')!.getAttribute('aria-expanded')).toBe(
      'true'
    );
    const values = document.querySelectorAll<HTMLButtonElement>(
      '.mat-mdc-snack-bar-container .bookmark-values button'
    );
    expect(values).toHaveLength(2);
    expect(values[0].textContent?.trim()).toBe('保留搜尋值');
    expect(values[1].textContent?.trim()).toBe('另一個搜尋值');
    values[1].click();
    expect(selected).toHaveBeenCalledExactlyOnceWith('另一個搜尋值');
    await vi.waitFor(() => expect(component.isOpen()).toBe(false));
  });

  it('切換或清除設定會關閉舊書籤，避免沿用前一份資料', async () => {
    const { fixture, page, component, getItemById } = await setup();
    fixture.componentRef.setInput('bookmarkId', 'first');
    await fixture.whenStable();
    page.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    fixture.componentRef.setInput('bookmarkId', 'second');
    await fixture.whenStable();
    await vi.waitFor(() => expect(component.isOpen()).toBe(false));
    page.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(getItemById).toHaveBeenLastCalledWith('second');
    fixture.componentRef.setInput('bookmarkId', '');
    await fixture.whenStable();
    await vi.waitFor(() => expect(component.isOpen()).toBe(false));
    expect(page.querySelector('button')).toBeNull();
  });

  it('載入失敗時顯示錯誤並能重新載入', async () => {
    const { fixture, page, getItemById } = await setup();
    getItemById.mockReturnValueOnce(
      throwError(() => new Error('Request failed'))
    );
    fixture.componentRef.setInput('bookmarkId', 'bookmark');
    await fixture.whenStable();
    page.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    expect(
      document.querySelector('.mat-mdc-snack-bar-container [role="alert"]')
    ).not.toBeNull();
    document
      .querySelector<HTMLButtonElement>(
        '.mat-mdc-snack-bar-container .value-button'
      )!
      .click();
    await fixture.whenStable();
    expect(getItemById).toHaveBeenCalledTimes(2);
    expect(
      document.querySelector('.mat-mdc-snack-bar-container .bookmark-values')!
        .textContent
    ).toContain('保留搜尋值');
  });

  it('空陣列顯示無資料，不產生搜尋按鈕', async () => {
    const { fixture, page, getItemById } = await setup();
    getItemById.mockReturnValueOnce(of([]));
    fixture.componentRef.setInput('bookmarkId', 'empty');
    await fixture.whenStable();
    page.querySelector<HTMLButtonElement>('button')!.click();
    await fixture.whenStable();
    const values = document.querySelector(
      '.mat-mdc-snack-bar-container .bookmark-values'
    )!;
    expect(values.querySelector('button')).toBeNull();
    expect(values.textContent).toContain('g.noData');
  });
});
