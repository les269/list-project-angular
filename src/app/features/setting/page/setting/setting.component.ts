import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingService } from '../../services/setting.service';
import { TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { Setting } from '../../model';

@Component({
  selector: 'app-setting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setting.component.html',
  styleUrl: './setting.component.scss',
})
export class SettingComponent implements OnInit {
  model: Setting[] = [];
  constructor(
    private translateService: TranslateService,
    private settingService: SettingService,
    private snackbarService: SnackbarService
  ) {}
  ngOnInit(): void {
    this.getSetting();
  }

  getSetting() {
    this.settingService.getAll().subscribe(res => {
      this.model = res;
    });
  }
}
