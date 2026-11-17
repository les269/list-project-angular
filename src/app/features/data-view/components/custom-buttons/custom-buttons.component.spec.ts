import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { FileService } from '../../../../core/services/file.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ThemeCustom, ThemeCustomType } from '../../../theme/models';
import { ThemeService } from '../../../theme/services/theme.service';
import { CustomButtonsComponent } from './custom-buttons.component';

async function setup() {
  const response = new Subject<boolean>();
  const fileService = {
    delete: vi.fn(() => response),
    moveTo: vi.fn(() => response),
    openFolder: vi.fn(() => response),
  };
  TestBed.configureTestingModule({
    providers: [
      provideTranslateService(),
      { provide: ThemeService, useValue: {} },
      { provide: MatDialog, useValue: {} },
      { provide: FileService, useValue: fileService },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
    ],
  });
  const fixture = TestBed.createComponent(CustomButtonsComponent);
  const customList = [
    ThemeCustomType.deleteFile,
    ThemeCustomType.moveTo,
    ThemeCustomType.openFolder,
  ].map(
    type =>
      ({
        type,
        byKey: type,
        label: type,
        deleteFile: '/file',
        filePathForMoveTo: '/file',
        moveTo: '/target',
        openFolder: '/folder',
      }) as ThemeCustom
  );
  fixture.componentRef.setInput('themeCustomList', customList);
  fixture.componentRef.setInput('data', { id: 'a' });
  fixture.componentRef.setInput('headerId', 'header');
  fixture.componentRef.setInput('defaultKey', 'id');
  fixture.componentRef.setInput('customValueMap', {});
  await fixture.whenStable();
  const buttons = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
  return { fixture, buttons, response, fileService };
}

it('檔案狀態未取得、不存在或主鍵缺漏時停用，存在時啟用並隨 input 更新', async () => {
  const { fixture, buttons, fileService } = await setup();
  expect(buttons().map(button => button.disabled)).toEqual([true, true, true]);
  buttons()[0].click();
  expect(fileService.delete).not.toHaveBeenCalled();
  fixture.componentRef.setInput('fileExist', { a: true });
  await fixture.whenStable();
  expect(buttons().map(button => button.disabled)).toEqual([
    false,
    false,
    false,
  ]);
  fixture.componentRef.setInput('fileExist', { a: false });
  await fixture.whenStable();
  expect(buttons().map(button => button.disabled)).toEqual([true, true, true]);
  fixture.componentRef.setInput('fileExist', { b: true });
  await fixture.whenStable();
  expect(buttons().map(button => button.disabled)).toEqual([true, true, true]);
});

it.each([0, 1])('檔案操作成功後停用按鈕（index %i）', async index => {
  const { fixture, buttons, response } = await setup();
  fixture.componentRef.setInput('fileExist', { a: true });
  await fixture.whenStable();
  buttons()[index].click();
  response.next(true);
  await fixture.whenStable();
  expect(buttons().map(button => button.disabled)).toEqual([true, true, true]);
});
