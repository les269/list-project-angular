import { OverlayContainer } from '@angular/cdk/overlay';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { MessageBoxService } from '../../../core/services/message-box.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { LayoutStore } from '../../../core/stores/layout.store';
import { getHeaderIdByHeader } from '../../../shared/util/helper';
import { ThemeHeader, ThemeHeaderType } from '../models';
import { ShareTagService } from '../services/share-tag.service';
import { ShareTagListComponent } from './share-tag-list/share-tag-list.component';
import { ThemeVisibleComponent } from './theme-visible/theme-visible.component';

it('主題顯示切換依隱藏狀態操作正確的 headerId', async () => {
  const header: ThemeHeader = {
    name: 'demo',
    version: '1',
    title: 'Demo',
    type: ThemeHeaderType.table,
    seq: 1,
  };
  const hidden = signal(true);
  const store = {
    list: signal({ imageList: [], table: [header] }),
    hasHidden: () => hidden(),
    changeHidden: vi.fn(() => hidden.update(value => !value)),
  };
  await TestBed.configureTestingModule({
    imports: [ThemeVisibleComponent],
    providers: [
      provideTranslateService(),
      { provide: LayoutStore, useValue: store },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ThemeVisibleComponent);
  await fixture.whenStable();
  const page: HTMLElement = fixture.nativeElement;
  const button = page.querySelector<HTMLButtonElement>(
    '.visibility-row button'
  )!;
  expect(button.textContent).toContain('g.visible');
  button.click();
  await fixture.whenStable();
  expect(store.changeHidden).toHaveBeenCalledExactlyOnceWith(
    getHeaderIdByHeader(header)
  );
  expect(button.textContent).toContain('g.hide');
});

it('實際開啟編輯彈窗時鎖定 ID，畫面編輯名稱後儲存原標籤', async () => {
  const service = {
    getAllTag: () => of([{ shareTagId: 'existing', shareTagName: 'Original' }]),
    addTag: vi.fn(() => of(undefined)),
  };
  await TestBed.configureTestingModule({
    imports: [ShareTagListComponent],
    providers: [
      provideTranslateService(),
      { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      { provide: ShareTagService, useValue: service },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      { provide: MessageBoxService, useValue: {} },
      {
        provide: SnackbarService,
        useValue: { openI18N: vi.fn(), isBlankMessage: vi.fn() },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ShareTagListComponent);
  await fixture.whenStable();
  fixture.componentInstance.onEditTag({
    shareTagId: 'existing',
    shareTagName: 'Original',
  });
  await fixture.whenStable();
  const overlay = TestBed.inject(OverlayContainer).getContainerElement();
  expect(overlay.querySelector('.dialog-title')?.textContent).toContain(
    'shareTag.editTag'
  );
  const id = overlay.querySelector<HTMLInputElement>(
    'app-signal-field[label="shareTag.tagId"] input'
  )!;
  const name = overlay.querySelector<HTMLInputElement>(
    'app-signal-field[label="shareTag.tagName"] input'
  )!;
  expect(id.disabled).toBe(true);
  expect(id.value).toBe('existing');
  expect(overlay.querySelectorAll('label.require')).toHaveLength(2);
  name.value = ' Updated ';
  name.dispatchEvent(new Event('input', { bubbles: true }));
  await fixture.whenStable();
  overlay.querySelector<HTMLButtonElement>('.dialog-button-primary')!.click();
  await fixture.whenStable();
  expect(service.addTag).toHaveBeenCalledExactlyOnceWith({
    shareTagId: 'existing',
    shareTagName: 'Updated',
  });
});
