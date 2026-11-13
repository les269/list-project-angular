import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly translateService = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);

  defaultLang = 'zh-tw';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('lng');
      if (savedLang) {
        this.defaultLang = savedLang;
      }
      this.translateService.setFallbackLang(this.defaultLang);
      this.translateService.use(this.defaultLang);
    }
  }

  changeLang(lang: string) {
    this.translateService.use(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lng', lang);
    }
  }
}
