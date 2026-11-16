import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ThemeHeader, ThemeHeaderType } from '../../../features/theme/models';
import { LayoutStore } from '../../stores/layout.store';
import { SidenavComponent } from './sidenav.component';

@Component({ template: '' })
class TestPage {}

@Component({
  imports: [SidenavComponent, RouterOutlet],
  template: '<app-sidenav /><router-outlet />',
})
class TestLayout {}

async function setup(url: string) {
  const theme: ThemeHeader = {
    name: 'samples',
    version: '1',
    title: '表格主題',
    type: ThemeHeaderType.table,
    seq: 1,
  };
  const openSidenav = signal(true);
  await TestBed.configureTestingModule({
    providers: [
      provideTranslateService(),
      provideRouter([
        {
          path: '',
          component: TestLayout,
          children: [
            { path: '', component: TestPage },
            { path: 'setting/disk', component: TestPage },
            { path: 'table/:name/:version', component: TestPage },
          ],
        },
      ]),
      {
        provide: LayoutStore,
        useValue: {
          openSidenav,
          visibleList: signal({ imageList: [], table: [theme] }),
          getQueryParamsByHeader: () => ({ page: 1, searchValue: '' }),
          toggleSidenav: () => openSidenav.update(open => !open),
        },
      },
    ],
  }).compileComponents();
  const harness = await RouterTestingHarness.create(url);
  await harness.fixture.whenStable();
  const element = harness.routeNativeElement!;
  return { harness, element };
}

describe('Sidenav 導覽選取狀態', () => {
  it('進入設定子頁時標示設定，回首頁後只標示首頁', async () => {
    const { harness, element } = await setup('/setting/disk');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/');
    expect(element.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(
      element.querySelector('[aria-current="page"]')?.textContent
    ).toContain('title.setting');

    await harness.navigateByUrl('/');
    await harness.fixture.whenStable();
    expect(element.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(
      element.querySelector('[aria-current="page"]')?.textContent
    ).toContain('title.home');
  });

  it('變更篩選與頁碼時仍標示目前主題，切換版本後不誤標示', async () => {
    const { harness, element } = await setup(
      '/table/samples/1?page=3&searchValue=filtered#results'
    );
    expect(element.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(
      element.querySelector('[aria-current="page"]')?.textContent
    ).toContain('表格主題');

    await harness.navigateByUrl('/table/samples/2?page=3');
    await harness.fixture.whenStable();
    expect(element.querySelector('[aria-current="page"]')).toBeNull();
  });
});
