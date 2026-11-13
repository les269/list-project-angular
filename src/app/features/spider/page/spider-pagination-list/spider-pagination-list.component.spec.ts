import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CopySpiderPaginationComponent } from '../../components/copy-spider-pagination/copy-spider-pagination.component';
import { SpiderPaginationDataComponent } from '../../components/spider-pagination-data/spider-pagination-data.component';
import { SpiderPaginationService } from '../../services';
import { SpiderPaginationListComponent } from './spider-pagination-list.component';

async function setup() {
  const closed = new Subject<string | undefined>();
  const dialog = { open: vi.fn(() => ({ afterClosed: () => closed })) };
  const service = { getAll: vi.fn(() => of([])) };
  const snackbar = { openI18N: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [SpiderPaginationListComponent],
    providers: [
      provideTranslateService(),
      { provide: MatDialog, useValue: dialog },
      { provide: Router, useValue: { navigate: vi.fn() } },
      {
        provide: ActivatedRoute,
        useValue: { queryParamMap: of(convertToParamMap({})) },
      },
      { provide: SpiderPaginationService, useValue: service },
      { provide: SnackbarService, useValue: snackbar },
      { provide: MessageBoxService, useValue: {} },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(SpiderPaginationListComponent);
  await fixture.whenStable();
  return { fixture, closed, dialog, service, snackbar };
}

describe('SpiderPaginationListComponent', () => {
  it('資料入口開啟指定爬蟲的資料 dialog', async () => {
    const { fixture, dialog } = await setup();
    const item = {
      spiderPaginationId: 'anime',
      paginationConfig: {},
    } as Parameters<SpiderPaginationListComponent['onRedirectData']>[0];
    fixture.componentInstance.onRedirectData(item);
    expect(dialog.open).toHaveBeenCalledWith(SpiderPaginationDataComponent, {
      data: { spiderPaginationId: 'anime' },
      width: '1100px',
      maxWidth: '95vw',
    });
  });

  it.each(['ok', undefined])(
    '複製 dialog 回傳 %s 時正確更新清單',
    async result => {
      const { fixture, closed, dialog, service, snackbar } = await setup();
      const source = { spiderPaginationId: 'original', paginationConfig: {} };
      // 列表只需傳遞來源物件，實際設定內容由 dialog 處理。
      const item = source as Parameters<
        SpiderPaginationListComponent['onCopy']
      >[0];
      fixture.componentInstance.onCopy(item);
      expect(dialog.open).toHaveBeenCalledWith(CopySpiderPaginationComponent, {
        data: { source: item },
      });
      expect(service.getAll).toHaveBeenCalledTimes(1);
      expect(snackbar.openI18N).not.toHaveBeenCalled();
      closed.next(result);
      closed.complete();
      await fixture.whenStable();
      if (result === 'ok') {
        expect(service.getAll).toHaveBeenCalledTimes(2);
        expect(snackbar.openI18N).toHaveBeenCalledWith('msg.copySuccess');
      } else {
        expect(service.getAll).toHaveBeenCalledTimes(1);
        expect(snackbar.openI18N).not.toHaveBeenCalled();
      }
    }
  );
});
