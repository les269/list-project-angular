import { Component, inject, OnInit } from '@angular/core';
import { SettingLinkComponent } from '../setting-link/setting-link.component';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-setting-sidebar',
  imports: [SettingLinkComponent, TranslateModule],
  templateUrl: './setting-sidebar.component.html',
  styleUrls: ['./setting-sidebar.component.scss'],
})
export class SettingSidebarComponent {
  router = inject(Router);

  routes = [
    {
      link: '/setting',
      text: 'title.database',
    },
    {
      link: '/setting/disk',
      text: 'title.disk',
    },
  ];
}
