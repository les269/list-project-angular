import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { LayoutStore } from '../../../../core/stores/layout.store';
import {
  CURRENT_DYNAMIC_DB_SETTING_NAME,
  DEFAULT_DYNAMIC_DB_KEY,
} from '../../../../shared/util/global';
import { ThemeService } from '../../../theme/services/theme.service';
import { DatabaseEditComponent } from '../../components/database-edit/database-edit.component';
import { DatabaseConfig, DatabaseType, Setting } from '../../model';
import { DatabaseConfigService } from '../../services/database-config.service';
import { SettingService } from '../../services/setting.service';

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
  readonly settingService = inject(SettingService);
  readonly databaseConfigService = inject(DatabaseConfigService);
  readonly route = inject(ActivatedRoute);
  readonly matDialog = inject(MatDialog);
  readonly messageBoxService = inject(MessageBoxService);
  readonly snackbarService = inject(SnackbarService);
  readonly themeService = inject(ThemeService);
  readonly layoutStore = inject(LayoutStore);

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
  eDatabaseType = DatabaseType;

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
    if (element.databaseType === DatabaseType.SQLITE) {
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
    if (element.databaseType === DatabaseType.SQLITE) {
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
        this.layoutStore.loadThemeList();
        this.getCurrentConfig();
        this.snackbarService.openI18N('msg.changeDatabaseSuccess');
      });
  }

  onOpenLocalFolder(element: DatabaseConfig) {
    this.databaseConfigService
      .openLocalFolder(element.configId)
      .subscribe(result => {
        this.snackbarService.openI18N('msg.openLocalFolderSuccess');
      });
  }
}
