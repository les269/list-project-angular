import { Component, inject, OnInit, signal, Signal } from '@angular/core';

import { SettingService } from '../../services/setting.service';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { Setting } from '../../model';
import { SettingSidebarComponent } from '../../components/setting-sidebar/setting-sidebar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [RouterOutlet, SettingSidebarComponent],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.scss',
})
export class SettingComponent implements OnInit {
  readonly model = signal<Setting[]>([]);
  translateService: TranslateService = inject(TranslateService);
  settingService: SettingService = inject(SettingService);
  snackbarService: SnackbarService = inject(SnackbarService);
  ngOnInit(): void {
    this.getSetting();
  }

  getSetting() {
    this.settingService.getAll().subscribe(res => {
      this.model.set(res);
    });
  }
}
