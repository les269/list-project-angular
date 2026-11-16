import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ThemeHeaderType, ThemeImageType } from '../../models';
import { ThemeItemManageComponent } from '../theme-item-manage/theme-item-manage.component';
import { ThemeImageComponent } from './theme-image.component';

describe('ThemeImageComponent 來源欄位', () => {
  it('切換來源保留欄位值，失焦去除空白並依來源驗證', async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeImageComponent],
      providers: [provideTranslateService()],
    })
      .overrideComponent(ThemeImageComponent, {
        remove: { imports: [ThemeItemManageComponent] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(ThemeImageComponent);
    fixture.componentRef.setInput('themeHeaderType', ThemeHeaderType.imageList);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const page: HTMLElement = fixture.nativeElement;
    const key = page.querySelector<HTMLInputElement>('app-signal-field input')!;
    key.value = '  imagePath  ';
    key.dispatchEvent(new Event('input'));
    key.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(component.formModel().json.imageKey).toBe('imagePath');
    expect(component.form.json().valid()).toBe(true);

    page.querySelector<HTMLInputElement>('#imageUrlRadio')!.click();
    await fixture.whenStable();
    expect(component.formModel().json.type).toBe(ThemeImageType.url);
    expect(component.form.json().invalid()).toBe(true);
    const url = page.querySelector<HTMLInputElement>('app-signal-field input')!;
    url.value = '  https://example.com/image.jpg  ';
    url.dispatchEvent(new Event('input'));
    url.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(component.formModel().json.imageUrl).toBe(
      'https://example.com/image.jpg'
    );
    expect(component.form.json().valid()).toBe(true);

    page.querySelector<HTMLInputElement>('#imageKeyRadio')!.click();
    await fixture.whenStable();
    expect(
      page.querySelector<HTMLInputElement>('app-signal-field input')!.value
    ).toBe('imagePath');
  });
});
