import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SettingSidebarComponent } from './setting-sidebar.component';

@Component({ template: '' })
class TestSettingsPage {}

@Component({
  imports: [SettingSidebarComponent, RouterOutlet],
  template: '<app-setting-sidebar /><router-outlet />',
})
class TestSettingsLayout {}

async function setup(url: string) {
  await TestBed.configureTestingModule({
    providers: [
      provideTranslateService(),
      provideRouter([
        {
          path: 'setting',
          component: TestSettingsLayout,
          children: [
            { path: '', component: TestSettingsPage },
            { path: 'disk', component: TestSettingsPage },
          ],
        },
      ]),
    ],
  }).compileComponents();
  const harness = await RouterTestingHarness.create(url);
  await harness.fixture.whenStable();
  return { harness, element: harness.routeNativeElement! };
}

describe('設定側欄', () => {
  it.each([
    ['/setting?view=list#summary', 'title.database'],
    ['/setting/disk?view=list#summary', 'title.disk'],
  ])('網址為 %s 時只標示目前設定頁', async (url, label) => {
    const { element } = await setup(url);
    const current = element.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toContain(label);
  });

  it('點選資料庫入口會切換頁面並更新選取狀態', async () => {
    const { harness, element } = await setup('/setting/disk');
    element.querySelector<HTMLAnchorElement>('a[href="/setting"]')!.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/setting');
    expect(element.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(
      element.querySelector('[aria-current="page"]')?.textContent
    ).toContain('title.database');
  });
});
