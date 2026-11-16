import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { MessageBoxComponent } from './message-box.component';

async function setup(onlyOk = false) {
  const dialog = { close: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [MessageBoxComponent],
    providers: [
      provideTranslateService(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: { message: '是否繼續？', onlyOk },
      },
      { provide: MatDialogRef, useValue: dialog },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(MessageBoxComponent);
  await fixture.whenStable();
  const page: HTMLElement = fixture.nativeElement;
  return { page, dialog };
}

it('確認僅關閉一次，並保留呼叫端使用的 ok 回傳值', async () => {
  const { page, dialog } = await setup();
  page.querySelector<HTMLButtonElement>('.dialog-button-primary')!.click();
  expect(dialog.close).toHaveBeenCalledExactlyOnceWith('ok');
});

it('取消僅關閉一次，不回傳確認值', async () => {
  const { page, dialog } = await setup();
  page.querySelector<HTMLButtonElement>('.dialog-actions button')!.click();
  expect(dialog.close).toHaveBeenCalledExactlyOnceWith();
});

it('僅提示模式保留確定操作與原有回傳值', async () => {
  const { page, dialog } = await setup(true);
  const buttons = page.querySelectorAll<HTMLButtonElement>(
    '.dialog-actions button'
  );
  expect(buttons).toHaveLength(1);
  buttons[0].click();
  expect(dialog.close).toHaveBeenCalledExactlyOnceWith('ok');
});
