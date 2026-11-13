import { TestBed } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of, Subject } from 'rxjs';
import { MessageBoxService } from '../../../core/services/message-box.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ShareTag, ShareTagValue } from '../models';
import { ShareTagService } from '../services/share-tag.service';
import { ShareTagListComponent } from './share-tag-list/share-tag-list.component';
import { ShareTagValueListComponent } from './share-tag-value-list/share-tag-value-list.component';

describe('Share tag forms', () => {
  async function setup() {
    const pending = new Subject<void>();
    const confirmation = new Subject<string>();
    const messages = {
      openI18N: vi.fn((): Observable<string> => confirmation),
    };
    const closed = new Subject<void>();
    const addDialog = {
      disableClose: false,
      afterClosed: () => closed,
      close: vi.fn(() => closed.next()),
    };
    const service = {
      getAllTag: vi.fn((): Observable<ShareTag[]> => of([])),
      getShareTagValue: vi.fn((): Observable<ShareTagValue[]> => of([])),
      addTag: vi.fn((): Observable<void> => pending),
      addTagValue: vi.fn((): Observable<void> => pending),
      inUse: vi.fn((): Observable<string[]> => of([])),
      deleteTag: vi.fn((): Observable<void> => pending),
      deleteTagValue: vi.fn((): Observable<void> => pending),
      deleteShareTagValueList: vi.fn((): Observable<void> => pending),
    };
    const snackbar = { openI18N: vi.fn(), isBlankMessage: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ShareTagListComponent, ShareTagValueListComponent],
      providers: [
        provideTranslateService(),
        { provide: ShareTagService, useValue: service },
        { provide: SnackbarService, useValue: snackbar },
        { provide: MessageBoxService, useValue: messages },
        { provide: MatDialog, useValue: { open: () => addDialog } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { shareTagId: 'tag', shareTagName: 'Tag' },
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: { open: () => addDialog } })
      .compileComponents();
    return { service, pending, addDialog, snackbar, messages, confirmation };
  }

  it('Tag 刪除從確認視窗到請求結束皆阻擋重複操作，取消與失敗後解鎖', async () => {
    const { service, pending, messages, confirmation } = await setup();
    const fixture = TestBed.createComponent(ShareTagListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.deleteTag('tag');
    component.deleteTag('tag');
    expect(service.inUse).toHaveBeenCalledTimes(1);
    expect(messages.openI18N).toHaveBeenCalledTimes(1);
    expect(component.isDeleting()).toBe(true);
    confirmation.next('yes');
    expect(service.deleteTag).toHaveBeenCalledTimes(1);
    component.deleteTag('tag');
    expect(service.inUse).toHaveBeenCalledTimes(1);
    pending.error(new Error('Delete failed'));
    expect(component.isDeleting()).toBe(false);
    messages.openI18N.mockReturnValue(of(''));
    component.deleteTag('tag');
    expect(component.isDeleting()).toBe(false);
    expect(service.deleteTag).toHaveBeenCalledTimes(1);
    messages.openI18N.mockReturnValue(of('yes'));
    service.deleteTag.mockReturnValue(of(undefined));
    component.deleteTag('tag');
    await fixture.whenStable();
    expect(component.isDeleting()).toBe(false);
    expect(service.getAllTag).toHaveBeenCalledTimes(2);
  });

  it.each(['single', 'bulk'])(
    'Tag value %s 刪除共用操作鎖並直接使用翻譯 key',
    async mode => {
      const { service, pending, messages, confirmation } = await setup();
      service.getShareTagValue.mockReturnValue(
        of([{ shareTagId: 'tag', value: 'value' }])
      );
      const fixture = TestBed.createComponent(ShareTagValueListComponent);
      await fixture.whenStable();
      const component = fixture.componentInstance;
      component.selection.select(component.dataSource.value().data[0]);
      const submit = () =>
        mode === 'single'
          ? component.deleteTag('value')
          : component.onDeleteSelect();
      submit();
      component.deleteTag('value');
      component.onDeleteSelect();
      expect(messages.openI18N).toHaveBeenCalledExactlyOnceWith(
        'msg.sureDeleteTagValue'
      );
      expect(component.isDeleting()).toBe(true);
      confirmation.next('yes');
      const request =
        mode === 'single'
          ? service.deleteTagValue
          : service.deleteShareTagValueList;
      expect(request).toHaveBeenCalledTimes(1);
      pending.error(new Error('Delete failed'));
      expect(component.isDeleting()).toBe(false);
      messages.openI18N.mockReturnValue(of(''));
      submit();
      expect(component.isDeleting()).toBe(false);
      expect(request).toHaveBeenCalledTimes(1);
      messages.openI18N.mockReturnValue(of('yes'));
      request.mockReturnValue(of(undefined));
      submit();
      await fixture.whenStable();
      expect(component.isDeleting()).toBe(false);
      expect(service.getShareTagValue).toHaveBeenCalledTimes(2);
      expect(component.selection.isEmpty()).toBe(true);
    }
  );

  it('修改 filter 不會重新綁定排序器與分頁器', async () => {
    await setup();
    const fixture = TestBed.createComponent(ShareTagValueListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const dataSource = component.dataSource.value();
    const sortSetter = vi.spyOn(dataSource, 'sort', 'set');
    const paginatorSetter = vi.spyOn(dataSource, 'paginator', 'set');
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.value = 'filter';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(dataSource.filter).toBe('filter');
    expect(sortSetter).not.toHaveBeenCalled();
    expect(paginatorSetter).not.toHaveBeenCalled();
  });

  it('Tag 表單阻擋重複送出，失敗後可重試並重新載入列表', async () => {
    const { service, pending, addDialog } = await setup();
    const fixture = TestBed.createComponent(ShareTagListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.openAddDialog();
    component.tagModel.set({ shareTagId: ' new ', shareTagName: ' New tag ' });
    component.confirmAddTag();
    component.confirmAddTag();
    await fixture.whenStable();
    expect(service.addTag).toHaveBeenCalledTimes(1);
    expect(service.addTag).toHaveBeenCalledWith({
      shareTagId: 'new',
      shareTagName: 'New tag',
    });
    expect(component.isSaving()).toBe(true);
    expect(component.tagForm.shareTagName().readonly()).toBe(true);
    expect(addDialog.disableClose).toBe(true);

    pending.error(new Error('Save failed'));
    expect(component.isSaving()).toBe(false);
    expect(addDialog.disableClose).toBe(false);
    expect(component.tagModel().shareTagName).toBe(' New tag ');
    service.addTag.mockReturnValue(of(undefined));
    component.confirmAddTag();
    await fixture.whenStable();
    expect(service.addTag).toHaveBeenCalledTimes(2);
    expect(service.getAllTag).toHaveBeenCalledTimes(2);
    expect(component.tagModel()).toEqual({ shareTagId: '', shareTagName: '' });
    expect(component.tagForm().touched()).toBe(false);
  });

  it('編輯時停用 ID，重新新增時清除欄位及互動狀態', async () => {
    const { addDialog } = await setup();
    const fixture = TestBed.createComponent(ShareTagListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.onEditTag({ shareTagId: 'existing', shareTagName: 'Existing' });
    await fixture.whenStable();
    expect(component.tagForm.shareTagId().disabled()).toBe(true);
    component.tagForm.shareTagName().markAsTouched();
    component.tagForm.shareTagName().markAsDirty();
    addDialog.close();
    component.openAddDialog();
    await fixture.whenStable();
    expect(component.tagForm.shareTagId().disabled()).toBe(false);
    expect(component.tagModel()).toEqual({ shareTagId: '', shareTagName: '' });
    expect(component.tagForm().touched()).toBe(false);
    expect(component.tagForm().dirty()).toBe(false);
  });

  it('Tag value 阻擋重複送出，失敗後解鎖，重新開啟時重設表單', async () => {
    const { service, pending } = await setup();
    const fixture = TestBed.createComponent(ShareTagValueListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.openAddValueDialog();
    component.newValueModel.set(' value ');
    component.confirmAddValueTag();
    component.confirmAddValueTag();
    await fixture.whenStable();
    expect(service.addTagValue).toHaveBeenCalledTimes(1);
    expect(service.addTagValue).toHaveBeenCalledWith({
      shareTagId: 'tag',
      value: 'value',
    });
    expect(component.isSaving()).toBe(true);

    pending.error(new Error('Save failed'));
    expect(component.isSaving()).toBe(false);
    service.addTagValue.mockReturnValue(of(undefined));
    component.confirmAddValueTag();
    await fixture.whenStable();
    expect(service.getShareTagValue).toHaveBeenCalledTimes(2);
    component.newValueForm().markAsDirty();
    component.openAddValueDialog();
    await fixture.whenStable();
    expect(component.newValueModel()).toBe('');
    expect(component.newValueForm().touched()).toBe(false);
    expect(component.newValueForm().dirty()).toBe(false);
  });

  it('Tag 首次載入與 reload 都綁定排序，並保留篩選條件', async () => {
    const { service } = await setup();
    const initial = new Subject<ShareTag[]>();
    service.getAllTag.mockReturnValue(initial);
    const fixture = TestBed.createComponent(ShareTagListComponent);
    await vi.waitFor(() => expect(service.getAllTag).toHaveBeenCalledTimes(1));
    const component = fixture.componentInstance;
    initial.next([
      { shareTagId: 'a', shareTagName: 'Alpha' },
      { shareTagId: 'b', shareTagName: 'Beta' },
    ]);
    initial.complete();
    await fixture.whenStable();
    const sort = component.sort()!;
    expect(component.dataSource.value().sort).toBe(sort);
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.value = ' B ';
    input.dispatchEvent(new Event('input'));
    sort.sort({ id: 'shareTagName', start: 'desc', disableClear: false });
    await fixture.whenStable();
    expect(
      component.dataSource.value().filteredData.map(tag => tag.shareTagId)
    ).toEqual(['b']);
    const previous = component.dataSource.value();
    service.getAllTag.mockReturnValue(
      of([
        { shareTagId: 'a', shareTagName: 'Alpha' },
        { shareTagId: 'b', shareTagName: 'Beta updated' },
      ])
    );
    component.dataSource.reload();
    await fixture.whenStable();
    expect(component.dataSource.value()).not.toBe(previous);
    expect(component.dataSource.value().filter).toBe('b');
    expect(component.dataSource.value().sort).toBe(sort);
    expect(sort.active).toBe('shareTagName');
    expect(sort.direction).toBe('desc');
    expect(input.value).toBe(' B ');
    expect(
      component.dataSource.value().filteredData.map(tag => tag.shareTagName)
    ).toEqual(['Beta updated']);
  });

  it('Tag value reload 成功後清空勾選，並保留篩選與排序', async () => {
    const { service } = await setup();
    service.getShareTagValue.mockReturnValue(
      of([
        { shareTagId: 'tag', value: 'Alpha' },
        { shareTagId: 'tag', value: 'Beta' },
      ])
    );
    const fixture = TestBed.createComponent(ShareTagValueListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const sort = component.sort()!;
    expect(component.dataSource.value().sort).toBe(sort);
    component.selection.select(component.dataSource.value().data[0]);
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.value = ' B ';
    input.dispatchEvent(new Event('input'));
    sort.sort({ id: 'value', start: 'desc', disableClear: false });
    await fixture.whenStable();
    expect(component.selection.selected).toHaveLength(1);
    const reload = new Subject<ShareTagValue[]>();
    service.getShareTagValue.mockReturnValue(reload);
    component.dataSource.reload();
    await vi.waitFor(() =>
      expect(service.getShareTagValue).toHaveBeenCalledTimes(2)
    );
    expect(component.selection.selected).toHaveLength(1);
    reload.next([
      { shareTagId: 'tag', value: 'Alpha' },
      { shareTagId: 'tag', value: 'Beta updated' },
    ]);
    reload.complete();
    await fixture.whenStable();
    expect(component.selection.isEmpty()).toBe(true);
    expect(component.dataSource.value().filter).toBe('b');
    expect(component.dataSource.value().sort).toBe(sort);
    expect(sort.active).toBe('value');
    expect(sort.direction).toBe('desc');
    expect(input.value).toBe(' B ');
    expect(
      component.dataSource.value().filteredData.map(tag => tag.value)
    ).toEqual(['Beta updated']);
  });

  it('Tag value 每頁顯示 25 筆，全選只操作排序後的當頁資料', async () => {
    const { service } = await setup();
    service.getShareTagValue.mockReturnValue(
      of(
        Array.from({ length: 60 }, (_, index) => ({
          shareTagId: 'tag',
          value: `value-${String(index).padStart(2, '0')}`,
        }))
      )
    );
    const fixture = TestBed.createComponent(ShareTagValueListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const paginator = component.paginator()!;
    expect(component.dataSource.value().paginator).toBe(paginator);
    expect(paginator.length).toBe(60);
    expect(
      fixture.nativeElement.querySelectorAll('tr.mat-mdc-row')
    ).toHaveLength(25);
    component.sort()!.sort({ id: 'value', start: 'desc', disableClear: false });
    await fixture.whenStable();
    component.toggleAllRows();
    await fixture.whenStable();
    expect(component.selection.selected).toHaveLength(25);
    expect(component.selection.selected[0].value).toBe('value-59');
    paginator.nextPage();
    await fixture.whenStable();
    expect(component.isAllSelected()).toBe(false);
    expect(component.isPagePartiallySelected()).toBe(false);
    component.toggleAllRows();
    await fixture.whenStable();
    expect(component.selection.selected).toHaveLength(50);
    component.toggleAllRows();
    await fixture.whenStable();
    expect(component.selection.selected).toHaveLength(25);
    expect(
      component.selection.selected.every(row => row.value >= 'value-35')
    ).toBe(true);
  });

  it('Tag value 篩選回第一頁，筆數與 reload 後的分頁資料保持一致', async () => {
    const { service } = await setup();
    const rows = Array.from({ length: 60 }, (_, index) => ({
      shareTagId: 'tag',
      value: `value-${String(index).padStart(2, '0')}`,
    }));
    service.getShareTagValue.mockReturnValue(of(rows));
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('test', {
      shareTag: {
        valueCount: '共 {{count}} 筆',
        filteredValueCount: '篩選結果 {{count}} 筆',
        selectedValueCount: '已選取 {{count}} 筆',
      },
    });
    await firstValueFrom(translate.use('test'));
    const fixture = TestBed.createComponent(ShareTagValueListComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const paginator = component.paginator()!;
    paginator.lastPage();
    await fixture.whenStable();
    expect(paginator.pageIndex).toBe(2);
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.value = 'value-5';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(paginator.pageIndex).toBe(0);
    expect(paginator.length).toBe(10);
    expect(
      fixture.nativeElement.querySelectorAll('tr.mat-mdc-row')
    ).toHaveLength(10);
    const summary: HTMLElement = fixture.nativeElement.querySelector(
      '[aria-live="polite"]'
    );
    expect(summary.textContent).toContain('共 60 筆');
    expect(summary.textContent).toContain('篩選結果 10 筆');
    service.getShareTagValue.mockReturnValue(of(rows.slice(0, 55)));
    component.dataSource.reload();
    await fixture.whenStable();
    expect(paginator.length).toBe(5);
    expect(summary.textContent).toContain('共 55 筆');
    expect(summary.textContent).toContain('篩選結果 5 筆');
    expect(
      fixture.nativeElement.querySelectorAll('tr.mat-mdc-row')
    ).toHaveLength(5);
  });
});
