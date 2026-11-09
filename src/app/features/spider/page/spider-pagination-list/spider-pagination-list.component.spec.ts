import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CopySpiderPaginationComponent } from '../../components/copy-spider-pagination/copy-spider-pagination.component';
import { SpiderPaginationService } from '../../services';
import { SpiderPaginationListComponent } from './spider-pagination-list.component';

describe('SpiderPaginationListComponent 複製', () => {
  it.each(['ok', undefined])('dialog 回傳 %s 時正確更新清單', async result => {
    const closed = new Subject<string | undefined>();
    const dialog = { open: vi.fn(() => ({ afterClosed: () => closed })) };
    const service = { getAll: vi.fn(() => of([])) };
    const snackbar = { openI18N: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [SpiderPaginationListComponent, TranslateModule.forRoot()],
      providers: [
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
  });
});
