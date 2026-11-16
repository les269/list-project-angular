import { Signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, Subject } from 'rxjs';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { DatasetConfigType, GroupDatasetConfigType } from '../model';
import { DatasetService } from '../service/dataset.service';
import { GroupDatasetService } from '../service/group-dataset.service';
import { CopyDatasetComponent } from './copy-dataset/copy-dataset.component';
import { CopyGroupDatasetComponent } from './copy-group-dataset/copy-group-dataset.component';

const cases: {
  component: Type<{ ok(): void; isProcessing: Signal<boolean> }>;
  kind: 'dataset' | 'group';
}[] = [
  { component: CopyDatasetComponent, kind: 'dataset' },
  { component: CopyGroupDatasetComponent, kind: 'group' },
];

describe.each(cases)('複製 $kind 彈窗', config => {
  async function setup() {
    const source =
      config.kind === 'dataset'
        ? {
            name: 'source',
            config: {
              type: DatasetConfigType.all,
              groupName: 'group',
              fieldList: [],
            },
          }
        : {
            groupName: 'source',
            config: {
              type: GroupDatasetConfigType.api,
              byKey: 'id',
              imageSaveFolder: '',
              groupDatasetFieldList: [],
              groupDatasetApiList: [],
              groupDatasetScrapyList: [],
            },
          };
    const query = vi.fn((): Observable<boolean> => of(false));
    const update = vi.fn((): Observable<void> => of(undefined));
    const dialog = { close: vi.fn(), disableClose: false };
    await TestBed.configureTestingModule({
      imports: [config.component],
      providers: [
        provideTranslateService(),
        { provide: MAT_DIALOG_DATA, useValue: { source } },
        { provide: MatDialogRef, useValue: dialog },
        {
          provide: DatasetService,
          useValue: { existDataset: query, updateDataset: update },
        },
        {
          provide: GroupDatasetService,
          useValue: { existGroupDataset: query, updateGroupDataset: update },
        },
        {
          provide: SnackbarService,
          useValue: { openI18N: vi.fn(), isBlankMessage: vi.fn() },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(config.component);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const setName = (value: string) => {
      if (config.kind === 'dataset') {
        (component as CopyDatasetComponent).sourceForm.name().value.set(value);
      } else {
        (component as CopyGroupDatasetComponent).sourceForm
          .groupName()
          .value.set(value);
      }
    };
    const page: HTMLElement = fixture.nativeElement;
    return { fixture, component, page, query, update, dialog, source, setName };
  }

  it('必填欄位有標示、驗證與關聯標題，取消不送出請求', async () => {
    const { fixture, page, query, update, dialog } = await setup();
    const input = page.querySelector<HTMLInputElement>(
      'app-signal-field input'
    )!;
    expect(page.querySelector<HTMLLabelElement>('label.require')!.htmlFor).toBe(
      input.id
    );
    expect(page.querySelector('.dialog-summary')).toBeNull();
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(
      page.querySelector<HTMLButtonElement>('.dialog-button-primary')!.disabled
    ).toBe(true);
    expect(page.querySelector('[role="alert"]')).not.toBeNull();
    page.querySelector<HTMLButtonElement>('.dialog-button')!.click();
    expect(dialog.close).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('查重與儲存採相同資料快照，且不修改來源資料', async () => {
    const { component, query, update, source, setName } = await setup();
    const original = structuredClone(source);
    const pending = new Subject<boolean>();
    query.mockReturnValue(pending);
    setName('copy');
    component.ok();
    component.ok();
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith('copy');
    setName('changed');
    pending.next(false);
    pending.complete();
    expect(update).toHaveBeenCalledWith({
      ...original,
      [config.kind === 'dataset' ? 'name' : 'groupName']: 'copy',
    });
    expect(source).toEqual(original);
    expect(component.isProcessing()).toBe(false);
  });

  it('重複名稱與請求失敗會解鎖，處理期間阻擋重複送出並可重試', async () => {
    const { fixture, page, component, query, update, dialog, setName } =
      await setup();
    setName('copy');
    query.mockReturnValue(of(true));
    component.ok();
    expect(update).not.toHaveBeenCalled();
    expect(component.isProcessing()).toBe(false);
    expect(dialog.disableClose).toBe(false);

    query.mockReturnValue(of(false));
    const pending = new Subject<void>();
    update.mockReturnValue(pending);
    component.ok();
    component.ok();
    await fixture.whenStable();
    expect(update).toHaveBeenCalledTimes(1);
    expect(dialog.disableClose).toBe(true);
    expect(
      page.querySelector<HTMLInputElement>('app-signal-field input')!.readOnly
    ).toBe(true);
    expect(
      [...page.querySelectorAll('button')].every(button => button.disabled)
    ).toBe(true);
    pending.error(new Error('Copy failed'));
    await fixture.whenStable();
    expect(component.isProcessing()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(
      page.querySelector<HTMLInputElement>('app-signal-field input')!.readOnly
    ).toBe(false);

    update.mockReturnValue(of(undefined));
    component.ok();
    expect(update).toHaveBeenCalledTimes(2);
    expect(dialog.close).toHaveBeenCalledWith('ok');
  });
});
