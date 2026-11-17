import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { FileService } from '../../../core/services/file.service';
import { ThemeService } from '../../theme/services/theme.service';
import {
  ThemeCustomValueRequest,
  ThemeCustomValueResponse,
} from '../../theme/models';
import { HeaderStore } from './header.store';
import { FilterStore } from './filter.store';
import { ResourceStore } from './resource.store';

@Component({ template: '' })
class ResourceHost {
  readonly store = inject(ResourceStore);
}

async function setup() {
  const rows = signal([{ id: 'a' }, { id: 'missing-a' }]);
  const pending: {
    params: ThemeCustomValueRequest;
    response: Subject<ThemeCustomValueResponse>;
    cancelled: boolean;
  }[] = [];
  const findCustomValue = vi.fn(
    (params: ThemeCustomValueRequest) =>
      new Observable<ThemeCustomValueResponse>(subscriber => {
        const request = {
          params,
          response: new Subject<ThemeCustomValueResponse>(),
          cancelled: false,
        };
        pending.push(request);
        const subscription = request.response.subscribe(subscriber);
        return () => {
          request.cancelled = true;
          subscription.unsubscribe();
        };
      })
  );
  TestBed.configureTestingModule({
    providers: [
      ResourceStore,
      {
        provide: HeaderStore,
        useValue: {
          headerId: signal('header'),
          defaultKey: signal('id'),
          themeOtherSetting: signal(undefined),
        },
      },
      { provide: FilterStore, useValue: { viewData: rows } },
      { provide: FileService, useValue: {} },
      { provide: ThemeService, useValue: { findCustomValue } },
    ],
  });
  const fixture = TestBed.createComponent(ResourceHost);
  // 先啟動 resource 的請求，保留未完成狀態以測試換頁期間的回應。
  TestBed.tick();
  return {
    fixture,
    store: fixture.componentInstance.store,
    rows,
    pending,
    findCustomValue,
  };
}

it('各頁回應依該次請求補齊主鍵，換頁等待期間不顯示上一頁結果', async () => {
  const { fixture, store, rows, pending } = await setup();
  expect(pending[0].params.valueList).toEqual(['a', 'missing-a']);
  pending[0].response.next({ a: { note: 'A' } });
  pending[0].response.complete();
  await fixture.whenStable();
  expect(store.customValueMap.value()).toEqual({
    a: { note: 'A' },
    'missing-a': {},
  });
  rows.set([{ id: 'b' }]);
  TestBed.tick();
  expect(store.customValueMap.value()).toEqual({});
  expect(pending[1].params.valueList).toEqual(['b']);
  pending[1].response.next({});
  pending[1].response.complete();
  await fixture.whenStable();
  expect(store.customValueMap.value()).toEqual({ b: {} });
});

it('換頁後取消上一頁請求，晚到的舊回應不覆蓋目前頁面', async () => {
  const { fixture, store, rows, pending } = await setup();
  rows.set([{ id: 'b' }, { id: 'missing-b' }]);
  TestBed.tick();
  expect(pending[0].cancelled).toBe(true);
  pending[0].response.next({ a: { note: 'old' } });
  pending[1].response.next({ b: { note: 'B' } });
  pending[1].response.complete();
  await fixture.whenStable();
  expect(store.customValueMap.value()).toEqual({
    b: { note: 'B' },
    'missing-b': {},
  });
});
