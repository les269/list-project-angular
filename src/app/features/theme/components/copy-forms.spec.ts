import { Signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of, Subject } from 'rxjs';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ThemeNoteComponent } from '../../data-view/components/theme-note/theme-note.component';
import { ThemeHeaderType, ThemeItem, ThemeItemType } from '../models';
import { ThemeItemService } from '../services';
import { ThemeService } from '../services/theme.service';
import { CopyThemeItemComponent } from './copy-theme-item/copy-theme-item.component';
import { CopyThemeComponent } from './copy-theme/copy-theme.component';

async function setup() {
  const pending = new Subject<void>();
  const themeCheck = new Subject<boolean>();
  const itemCheck = new Subject<ThemeItem | undefined>();
  const themeService = {
    existTheme: vi.fn((): Observable<boolean> => themeCheck),
    copyTheme: vi.fn((): Observable<void> => pending),
  };
  const itemService = {
    getThemeItem: vi.fn((): Observable<ThemeItem | undefined> => itemCheck),
    copyThemeItem: vi.fn((): Observable<void> => pending),
  };
  const dialogRef = { close: vi.fn(), disableClose: false };
  const data = {
    themeHeader: {
      name: 'source',
      version: '1',
      title: 'Source',
      type: ThemeHeaderType.table,
      seq: 0,
    },
    sourceItemId: 'source',
    type: ThemeItemType.LABEL,
    value: '<p>Note</p>',
    title: 'Note',
    disabled: true,
    save: vi.fn(),
  };
  await TestBed.configureTestingModule({
    imports: [
      CopyThemeComponent,
      CopyThemeItemComponent,
      ThemeNoteComponent,
      TranslateModule.forRoot(),
    ],
    providers: [
      { provide: ThemeService, useValue: themeService },
      { provide: ThemeItemService, useValue: itemService },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
      {
        provide: SnackbarService,
        useValue: { openI18N: vi.fn(), isBlankMessage: vi.fn() },
      },
    ],
  }).compileComponents();
  return {
    pending,
    themeCheck,
    itemCheck,
    themeService,
    itemService,
    dialogRef,
    data,
  };
}

const cases: {
  componentType: Type<{ ok(): void; isProcessing: Signal<boolean> }>;
  kind: string;
}[] = [
  { componentType: CopyThemeComponent, kind: 'theme' },
  { componentType: CopyThemeItemComponent, kind: 'item' },
];

describe.each(cases)('Copy $kind', config => {
  it('查詢與複製期間不重複送出，失敗後可重試', async () => {
    const state = await setup();
    const fixture = TestBed.createComponent(config.componentType);
    const component = fixture.componentInstance;
    if (config.kind === 'item')
      (component as CopyThemeItemComponent).targetItemId.set('target');
    await fixture.whenStable();
    component.ok();
    component.ok();
    const check =
      config.kind === 'theme'
        ? state.themeService.existTheme
        : state.itemService.getThemeItem;
    const copy =
      config.kind === 'theme'
        ? state.themeService.copyTheme
        : state.itemService.copyThemeItem;
    expect(check).toHaveBeenCalledTimes(1);
    expect(component.isProcessing()).toBe(true);
    expect(state.dialogRef.disableClose).toBe(true);
    if (config.kind === 'theme') state.themeCheck.next(false);
    else state.itemCheck.next(undefined);
    component.ok();
    expect(copy).toHaveBeenCalledTimes(1);
    state.pending.error(new Error('Copy failed'));
    expect(component.isProcessing()).toBe(false);
    expect(state.dialogRef.disableClose).toBe(false);
    state.themeService.existTheme.mockReturnValue(of(false));
    state.itemService.getThemeItem.mockReturnValue(of(undefined));
    copy.mockReturnValue(of(undefined));
    component.ok();
    await fixture.whenStable();
    expect(copy).toHaveBeenCalledTimes(2);
    expect(state.dialogRef.close).toHaveBeenCalledTimes(1);
  });

  it('目標已存在時停止複製並解鎖', async () => {
    const state = await setup();
    const fixture = TestBed.createComponent(config.componentType);
    const component = fixture.componentInstance;
    if (config.kind === 'item')
      (component as CopyThemeItemComponent).targetItemId.set('target');
    await fixture.whenStable();
    component.ok();
    if (config.kind === 'theme') {
      state.themeCheck.next(true);
      state.themeCheck.complete();
    } else {
      state.itemCheck.next({
        type: ThemeItemType.LABEL,
        itemId: 'target',
        description: '',
        json: [],
      });
      state.itemCheck.complete();
    }
    expect(state.themeService.copyTheme).not.toHaveBeenCalled();
    expect(state.itemService.copyThemeItem).not.toHaveBeenCalled();
    expect(component.isProcessing()).toBe(false);
    expect(state.dialogRef.disableClose).toBe(false);
  });
});

it('CopyTheme 驗證提示隨語言切換更新', async () => {
  await setup();
  const fixture = TestBed.createComponent(CopyThemeComponent);
  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('zh-test', { msg: { required: '必填' } });
  translate.setTranslation('en-test', { msg: { required: 'Required' } });
  await firstValueFrom(translate.use('zh-test'));
  await fixture.whenStable();
  expect(fixture.componentInstance.formAlertsObj().name[0].msg).toBe('必填');
  await firstValueFrom(translate.use('en-test'));
  await fixture.whenStable();
  expect(fixture.componentInstance.formAlertsObj().name[0].msg).toBe(
    'Required'
  );
});

it('Note 切換讀取與編輯模式後保留內容，儲存空白段落時使用空字串', async () => {
  const { data, dialogRef } = await setup();
  const fixture = TestBed.createComponent(ThemeNoteComponent);
  await fixture.whenStable();
  const component = fixture.componentInstance;
  expect(component.valueForm().disabled()).toBe(true);
  component.disabledModel.set(false);
  await fixture.whenStable();
  expect(component.valueForm().disabled()).toBe(false);
  expect(component.valueModel()).toBe('<p>Note</p>');
  component.valueModel.set('<p>Edited</p>');
  component.disabledModel.set(true);
  await fixture.whenStable();
  component.onSave();
  expect(data.save).toHaveBeenCalledWith('<p>Edited</p>');
  component.valueModel.set('<p></p>');
  component.onOK();
  expect(dialogRef.close).toHaveBeenCalledWith('');
});
