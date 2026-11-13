import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { SpiderPaginationDataJsonComponent } from './spider-pagination-data-json.component';

it('顯示所選資料的分組與格式化 JSON，內容保持唯讀且不解析為 HTML', async () => {
  const record = {
    spiderPaginationId: 'anime',
    groupId: '2026',
    dataId: 'same-id',
    data: {
      title: '<script>alert("test")</script>',
      nested: { enabled: false, items: [1, 2] },
    },
  };
  const close = vi.fn();
  await TestBed.configureTestingModule({
    imports: [SpiderPaginationDataJsonComponent],
    providers: [
      provideTranslateService(),
      { provide: MAT_DIALOG_DATA, useValue: record },
      { provide: MatDialogRef, useValue: { close } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(SpiderPaginationDataJsonComponent);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  expect(element.querySelector('h2')!.textContent).toContain('same-id');
  expect(element.querySelector('dl')!.textContent).toContain('2026');
  expect(element.querySelector('pre')!.textContent).toBe(
    JSON.stringify(record.data, null, 2)
  );
  expect(element.querySelector('script, input, textarea')).toBeNull();
  element.querySelector('button')!.click();
  expect(close).toHaveBeenCalled();
});
