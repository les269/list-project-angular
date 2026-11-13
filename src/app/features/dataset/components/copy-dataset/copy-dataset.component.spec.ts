import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { DatasetService } from '../../service/dataset.service';
import { DatasetConfigType } from '../../model';
import { CopyDatasetComponent } from './copy-dataset.component';

it('複製以正規化後的名稱查重，儲存使用相同資料快照', async () => {
  const existence = new Subject<boolean>();
  const service = {
    existDataset: vi.fn(() => existence),
    updateDataset: vi.fn(() => of(undefined)),
  };
  const source = {
    name: 'original',
    config: { type: DatasetConfigType.all, groupName: 'group', fieldList: [] },
  };
  await TestBed.configureTestingModule({
    imports: [CopyDatasetComponent],
    providers: [
      provideTranslateService(),
      { provide: MAT_DIALOG_DATA, useValue: { source } },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      { provide: DatasetService, useValue: service },
      {
        provide: SnackbarService,
        useValue: { openI18N: vi.fn(), isBlankMessage: vi.fn() },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(CopyDatasetComponent);
  fixture.detectChanges();
  const component = fixture.componentInstance;
  component.sourceForm.name().value.set(' copy ');
  component.ok();
  expect(service.existDataset).toHaveBeenCalledWith('copy');
  component.sourceForm.name().value.set('another');
  component.sourceForm.config.groupName().value.set('changed');
  existence.next(false);
  expect(service.updateDataset).toHaveBeenCalledWith({
    name: 'copy',
    config: source.config,
  });
  expect(source.name).toBe('original');
  expect(source.config.groupName).toBe('group');
});
