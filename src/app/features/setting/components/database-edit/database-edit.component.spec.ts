import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  DatabaseConfig,
  DatabaseType,
  TestConnectionResult,
} from '../../model';
import { DatabaseConfigService } from '../../services/database-config.service';
import { DatabaseEditComponent } from './database-edit.component';

async function setup() {
  const response = new Subject<TestConnectionResult>();
  const saveResponse = new Subject<void>();
  const service = {
    testConnection: vi.fn(() => response),
    saveConfig: vi.fn(() => saveResponse),
  };
  const snackbar = { openI18N: vi.fn() };
  const data = {
    isAdd: true,
    databaseConfig: {},
    databaseConfigList: [] as DatabaseConfig[],
  };
  await TestBed.configureTestingModule({
    imports: [DatabaseEditComponent, TranslateModule.forRoot()],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      { provide: DatabaseConfigService, useValue: service },
      { provide: MessageBoxService, useValue: { openI18N: () => of(true) } },
      { provide: SnackbarService, useValue: snackbar },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(DatabaseEditComponent);
  const component = fixture.componentInstance;
  component
    .form()
    .reset({
      ...component.formModel(),
      configId: 'demo',
      configName: 'Demo',
      sqliteFilePath: 'test.db',
    });
  fixture.detectChanges();
  return {
    component,
    fixture,
    response,
    saveResponse,
    service,
    snackbar,
    data,
  };
}

it('測試期間鎖定操作，回應僅認可送出時的資料', async () => {
  const { component, fixture, response, service, snackbar } = await setup();
  component.testConnection();
  fixture.detectChanges();
  expect(component.isProcessing()).toBe(true);
  expect(fixture.nativeElement.querySelector('#configName').readOnly).toBe(
    true
  );
  component.testConnection();
  component.onSubmit();
  expect(service.testConnection).toHaveBeenCalledTimes(1);
  expect(service.saveConfig).not.toHaveBeenCalled();
  component.form.configName().value.set('Changed');
  response.next({ success: true } as TestConnectionResult);
  expect(component.isProcessing()).toBe(false);
  expect(component.testSuccess().data.configName).toBe('Demo');
  component.onSubmit();
  expect(service.saveConfig).not.toHaveBeenCalled();
  expect(snackbar.openI18N).toHaveBeenCalledWith('msg.pleaseTestIfUpdata');
});

it('測試錯誤後解除鎖定，儲存期間不重複送出', async () => {
  const { component, response, service, saveResponse } = await setup();
  component.testConnection();
  response.error(new Error('Connection failed'));
  expect(component.isProcessing()).toBe(false);
  expect(component.testSuccess().success).toBe(false);
  component.testSuccess.set({
    success: true,
    data: structuredClone(component.form().value()),
  });
  component.onSubmit();
  component.onSubmit();
  expect(service.saveConfig).toHaveBeenCalledTimes(1);
  saveResponse.error(new Error('Save failed'));
  expect(component.isProcessing()).toBe(false);
});

it('configId 正規化後查重，不覆寫既有設定', async () => {
  const { component, data, response, service, snackbar } = await setup();
  data.databaseConfigList.push({ configId: 'demo' } as DatabaseConfig);
  component.form.configId().value.set(' demo ');
  component.testConnection();
  expect(service.testConnection.mock.calls[0]).toBeDefined();
  response.next({ success: true } as TestConnectionResult);
  component.form.configId().value.set(' demo ');
  component.onSubmit();
  expect(service.saveConfig).not.toHaveBeenCalled();
  expect(snackbar.openI18N).toHaveBeenCalledWith('msg.configIdExist');
});

it('PostgreSQL port 限制整數範圍，SQLite 不受影響', async () => {
  const { component } = await setup();
  component.form.databaseType().value.set(DatabaseType.POSTGRESQL);
  for (const port of [0, -1, 1.5, 65536]) {
    component.form.port().value.set(port);
    expect(component.form.port().invalid()).toBe(true);
  }
  for (const port of [1, 5432, 65535]) {
    component.form.port().value.set(port);
    expect(component.form.port().valid()).toBe(true);
  }
  component.form.databaseType().value.set(DatabaseType.SQLITE);
  component.form.port().value.set(0);
  expect(component.form.port().valid()).toBe(true);
});
