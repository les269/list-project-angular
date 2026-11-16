import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SpiderConfig } from '../../model';
import { SpiderConfigService } from '../../services/spider-config.service';
import { SpiderListComponent } from './spider-list.component';

function createConfig(spiderId: string, description: string): SpiderConfig {
  return {
    spiderId,
    description,
    primeKeySize: 1,
    isUrlBased: false,
    requestIntervalMs: 0,
    testData: { primeKeyList: [], url: '', resultJson: '' },
  };
}

const records = [
  createConfig('BETA', '每日新聞'),
  createConfig('alpha', '電影資料'),
  createConfig('gamma', 'News archive'),
];

async function setup() {
  const service = { getAll: vi.fn(() => of(records)) };
  await TestBed.configureTestingModule({
    imports: [SpiderListComponent],
    providers: [
      provideRouter([]),
      provideTranslateService(),
      { provide: SpiderConfigService, useValue: service },
      { provide: MessageBoxService, useValue: {} },
      { provide: SnackbarService, useValue: {} },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(SpiderListComponent);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  const input = element.querySelector<HTMLInputElement>(
    'input[type="search"]'
  )!;
  const clear = element.querySelector<HTMLButtonElement>(
    '.filter-controls button'
  )!;
  const rowIds = () =>
    Array.from(element.querySelectorAll('td.mat-column-spiderId'), cell =>
      cell.textContent?.trim()
    );
  const filter = async (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  };
  return { fixture, service, element, input, clear, rowIds, filter };
}

describe('SpiderListComponent 過濾', () => {
  it('比對 ID 與描述，忽略英文大小寫及前後空白，支援中文', async () => {
    const { filter, rowIds, service } = await setup();
    await filter(' ALPHA ');
    expect(rowIds()).toEqual(['alpha']);
    await filter('新聞');
    expect(rowIds()).toEqual(['BETA']);
    await filter('nEwS');
    expect(rowIds()).toEqual(['gamma']);
    await filter('   ');
    expect(rowIds()).toEqual(['BETA', 'alpha', 'gamma']);
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('無符合資料時提供提示，清除後還原清單並停用清除按鈕', async () => {
    const { fixture, filter, element, input, clear, rowIds } = await setup();
    expect(clear.disabled).toBe(true);
    await filter('missing');
    expect(rowIds()).toEqual([]);
    expect(element.querySelector('.empty-state')?.textContent).toContain(
      'g.noData'
    );
    expect(clear.disabled).toBe(false);
    clear.click();
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(rowIds()).toEqual(['BETA', 'alpha', 'gamma']);
    expect(clear.disabled).toBe(true);
  });

  it('過濾及重新載入資料後維持原有排序與過濾條件', async () => {
    const { fixture, filter, service, input, clear, rowIds } = await setup();
    fixture.componentInstance.sort()!.sort({
      id: 'description',
      start: 'asc',
      disableClear: false,
    });
    await fixture.whenStable();
    await filter('news');
    expect(rowIds()).toEqual(['gamma']);

    service.getAll.mockReturnValueOnce(
      of([...records, createConfig('delta', 'News alerts')])
    );
    fixture.componentInstance.list.reload();
    await fixture.whenStable();
    expect(input.value).toBe('news');
    expect(rowIds()).toEqual(['delta', 'gamma']);
    expect(service.getAll).toHaveBeenCalledTimes(2);

    clear.click();
    await fixture.whenStable();
    expect(rowIds()).toHaveLength(4);
    expect(rowIds().slice(0, 2)).toEqual(['delta', 'gamma']);
  });
});
