import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SettingService } from '../../services/setting.service';
import { CommonModule } from '@angular/common';
import { MatAnchor, MatButtonModule } from '@angular/material/button';
import { DatabaseConfig, Setting } from '../../model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatabaseConfigService } from '../../services/database-config.service';
import { MatDialog } from '@angular/material/dialog';
import { DatabaseEditComponent } from '../../components/database-edit/database-edit.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import {
  CURRENT_DYNAMIC_DB_SETTING_NAME,
  DEFAULT_DYNAMIC_DB_KEY,
} from '../../../../shared/util/global';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { filter, switchMap, tap } from 'rxjs';
import { ThemeService } from '../../../theme/services/theme.service';

@Component({
  selector: 'app-setting-database',
  imports: [
    TranslateModule,
    CommonModule,
    MatButtonModule,
    MatTableModule,
    DragDropModule,
    MatIconModule,
    MatTooltipModule,
    MatSortModule,
  ],
  templateUrl: './setting-database.component.html',
  styleUrl: './setting-database.component.scss',
})
export class SettingDatabaseComponent implements OnInit, AfterViewInit {
  settingService = inject(SettingService);
  databaseConfigService = inject(DatabaseConfigService);
  route = inject(ActivatedRoute);
  matDialog = inject(MatDialog);
  messageBoxService = inject(MessageBoxService);
  snackbarService = inject(SnackbarService);
  themeService = inject(ThemeService);

  currentSetting = signal<Setting>({} as Setting);
  dataSource = new MatTableDataSource<DatabaseConfig>([]);
  displayedColumns: string[] = [
    'configId',
    'configName',
    'databaseType',
    'description',
    'createdTime',
    'updatedTime',
    'other',
  ];
  DEFAULT_DYNAMIC_DB_KEY = DEFAULT_DYNAMIC_DB_KEY;
  sort = viewChild(MatSort);

  ngOnInit(): void {
    this.getCurrentConfig();
    this.refreshList();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort();
  }

  getCurrentConfig() {
    this.settingService
      .getByName(CURRENT_DYNAMIC_DB_SETTING_NAME)
      .subscribe(setting => {
        this.currentSetting.set(setting);
      });
  }

  get currentConfigName(): string {
    const config = this.dataSource.data.find(
      c => c.configId === this.currentSetting().value
    );
    return config ? config.configName : '';
  }

  refreshList() {
    this.databaseConfigService.getAll().subscribe(configs => {
      this.dataSource.data = configs;
    });
  }

  onAdd() {
    this.matDialog
      .open(DatabaseEditComponent, {
        width: '600px',
        data: {
          databaseConfig: {} as DatabaseConfig,
          databaseConfigList: this.dataSource.data,
          isAdd: true,
        },
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.refreshList();
        }
      });
  }

  onEdit(element: DatabaseConfig) {
    this.matDialog
      .open(DatabaseEditComponent, {
        width: '600px',
        data: {
          databaseConfig: element,
          databaseConfigList: this.dataSource.data,
          isAdd: false,
        },
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.refreshList();
        }
      });
  }
  onDelete(element: DatabaseConfig) {
    this.messageBoxService
      .openI18N('msg.sureDeleteDatabaseConfig', {
        params: { name: element.configName },
      })
      .subscribe(result => {
        if (result) {
          this.databaseConfigService
            .deleteConfig(element.configId)
            .subscribe(() => {
              this.refreshList();
            });
        }
      });
  }

  onTestConnection(element: DatabaseConfig) {
    var req = element;
    if (element.databaseType === 'sqlite') {
      req.sqliteFilePath = req.jdbcUrl
        .replace(/^jdbc:sqlite:/, '')
        .trim()
        .replace(/\\/g, '/');
    }
    this.databaseConfigService.testConnection(req).subscribe(result => {
      if (result.success) {
        this.snackbarService.openI18N('msg.testConnectionSuccess');
      } else {
        this.messageBoxService.openI18N('msg.testConnectionFailed', {
          params: { message: result.message },
          onlyOk: true,
        });
      }
    });
  }

  changeCurrent(element: DatabaseConfig) {
    var req = element;
    if (element.databaseType === 'sqlite') {
      req.sqliteFilePath = req.jdbcUrl
        .replace(/^jdbc:sqlite:/, '')
        .trim()
        .replace(/\\/g, '/');
    }
    this.databaseConfigService
      .testConnection(req)
      .pipe(
        tap(result => {
          if (!result.success) {
            this.messageBoxService.openI18N('msg.testConnectionFailed', {
              params: { message: result.message },
              onlyOk: true,
            });
          }
        }),
        filter(result => result.success),
        switchMap(() => {
          this.currentSetting.set({
            ...this.currentSetting(),
            value: element.configId,
          });
          return this.settingService.changeDatabase(this.currentSetting());
        })
      )
      .subscribe(() => {
        this.themeService.updateAllTheme();
        this.getCurrentConfig();
        this.snackbarService.openI18N('msg.changeDatabaseSuccess');
      });
  }
}
