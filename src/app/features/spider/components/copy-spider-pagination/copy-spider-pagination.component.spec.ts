import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, Subject } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  ExtractionRuleMode,
  LastUpdateMode,
  SpiderPagination,
  TimeUnit,
  UpdateIntervalMode,
} from '../../model';
import { SpiderPaginationService } from '../../services';
import { CopySpiderPaginationComponent } from './copy-spider-pagination.component';

async function setup() {
  const source: SpiderPagination = {
    spiderPaginationId: 'original',
    createdTime: new Date('2026-01-01T00:00:00Z'),
    updatedTime: new Date('2026-02-01T00:00:00Z'),
    paginationConfig: {
      groupIdTemplate: 'group-{year}',
      dataIdKey: 'id',
      paramSettings: [],
      startUrl: 'https://example.com/{year}',
      nextPageUrlKey: 'next',
      extractionRuleMode: ExtractionRuleMode.SELECT,
      extractionRuleList: [],
      updateControl: {
        lastUpdateMode: LastUpdateMode.FIXED,
        lastUpdateDate: new Date('2026-03-01T00:00:00Z'),
        lastUpdateParamKey: '',
        updateIntervalMode: UpdateIntervalMode.NONE,
        updateInterval: 0,
        updateIntervalUnit: TimeUnit.DAY,
        updateIntervalParamKey: '',
      },
      requestIntervalMs: 1000,
      retainHistory: false,
    },
  };
  const existence = new Subject<boolean>();
  const saved = new Subject<void>();
  const service = {
    isInUse: vi.fn((): Observable<boolean> => existence),
    update: vi.fn((_request: SpiderPagination): Observable<void> => saved),
  };
  const dialogRef = { close: vi.fn(), disableClose: false };
  const snackbar = { openI18N: vi.fn(), isBlankMessage: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [CopySpiderPaginationComponent],
    providers: [
      provideTranslateService(),
      { provide: MAT_DIALOG_DATA, useValue: { source } },
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: SpiderPaginationService, useValue: service },
      { provide: SnackbarService, useValue: snackbar },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(CopySpiderPaginationComponent);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    source,
    service,
    existence,
    saved,
    dialogRef,
    snackbar,
  };
}

describe('CopySpiderPaginationComponent', () => {
  it.each(['', '   '])('不允許空白 ID：%j', async value => {
    const { component, service, snackbar, dialogRef } = await setup();
    component.model.set({ spiderPaginationId: value });
    component.ok();
    expect(component.form.spiderPaginationId().touched()).toBe(true);
    expect(snackbar.isBlankMessage).toHaveBeenCalledWith(
      'spiderPagination.spiderPaginationId'
    );
    expect(service.isInUse).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('不允許使用來源 ID，且不修改來源資料', async () => {
    const { component, source, service, snackbar } = await setup();
    component.model.set({ spiderPaginationId: ' original ' });
    component.ok();
    expect(snackbar.openI18N).toHaveBeenCalledWith('msg.spiderExist');
    expect(service.isInUse).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(source.spiderPaginationId).toBe('original');
  });

  it('目標 ID 已存在時保留 dialog，允許修改 ID 後再試', async () => {
    const { component, existence, service, snackbar, dialogRef, fixture } =
      await setup();
    component.model.set({ spiderPaginationId: 'duplicate' });
    component.ok();
    existence.next(true);
    existence.complete();
    await fixture.whenStable();
    expect(service.update).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(snackbar.openI18N).toHaveBeenCalledWith('msg.spiderExist');
    expect(component.saving()).toBe(false);
    expect(component.form.spiderPaginationId().disabled()).toBe(false);
    expect(dialogRef.disableClose).toBe(false);
  });

  it('以相同快照查重並保存副本，保存成功後才關閉 dialog', async () => {
    const { component, fixture, source, service, existence, saved, dialogRef } =
      await setup();
    const original = structuredClone(source);
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input');
    input.value = ' copy ';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button');
    buttons[1].click();
    await fixture.whenStable();
    expect(service.isInUse).toHaveBeenCalledExactlyOnceWith('copy');
    expect(service.update).not.toHaveBeenCalled();
    expect(input.disabled).toBe(true);
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
    expect(dialogRef.disableClose).toBe(true);
    component.ok();
    expect(service.isInUse).toHaveBeenCalledTimes(1);
    component.model.set({ spiderPaginationId: 'changed-while-pending' });
    existence.next(false);
    existence.complete();
    expect(service.update).toHaveBeenCalledExactlyOnceWith({
      spiderPaginationId: 'copy',
      paginationConfig: original.paginationConfig,
    });
    const request = service.update.mock.calls[0][0];
    expect(request.paginationConfig).not.toBe(source.paginationConfig);
    expect(request.paginationConfig.updateControl).not.toBe(
      source.paginationConfig.updateControl
    );
    expect(source).toEqual(original);
    expect(component.saving()).toBe(true);
    expect(dialogRef.close).not.toHaveBeenCalled();
    saved.next();
    saved.complete();
    expect(dialogRef.close).toHaveBeenCalledExactlyOnceWith('ok');
    expect(component.saving()).toBe(false);
  });

  it.each(['existence', 'save'])('%s 失敗時保留輸入並可重試', async stage => {
    const { component, existence, saved, service, dialogRef, fixture } =
      await setup();
    component.model.set({ spiderPaginationId: 'copy' });
    component.ok();
    if (stage === 'existence') {
      existence.error(new Error('Existence check failed'));
      expect(service.update).not.toHaveBeenCalled();
    } else {
      existence.next(false);
      existence.complete();
      saved.error(new Error('Save failed'));
    }
    await fixture.whenStable();
    expect(component.saving()).toBe(false);
    expect(component.form.spiderPaginationId().disabled()).toBe(false);
    expect(component.model().spiderPaginationId).toBe('copy');
    expect(dialogRef.disableClose).toBe(false);
    expect(dialogRef.close).not.toHaveBeenCalled();
    service.isInUse.mockImplementation(() => of(false));
    service.update.mockImplementation(() => of(undefined));
    component.ok();
    expect(dialogRef.close).toHaveBeenCalledExactlyOnceWith('ok');
  });

  it('取消時不查重或保存', async () => {
    const { fixture, service, dialogRef } = await setup();
    const cancel: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    cancel.click();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(service.isInUse).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
  });
});
