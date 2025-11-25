import { Component, OnInit } from '@angular/core';
import { ThemeHeader, ThemeHeaderType } from '../../models';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { updateList } from '../../../../shared/state/layout.actions';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../core/components/message-box/message-box.component';
import { CopyThemeComponent } from '../../components/copy-theme.dialog';
import {
  getQueryParamsByHeader,
  isNotBlank,
} from '../../../../shared/util/helper';
import { selectLayoutByKey } from '../../../../shared/state/layout.selectors';
import { Observable } from 'rxjs';
import { ThemeVisibleComponent } from '../../components/theme-visible/theme-visible.component';
import { ShareTagListComponent } from '../../components/share-tag-list/share-tag-list.component';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule],
  selector: 'app-theme-list',
  templateUrl: 'theme-list.component.html',
  styleUrl: 'theme-list.component.scss',
})
export class ThemeListComponent implements OnInit {
  eThemeHeaderType = ThemeHeaderType;
  list$: Observable<
    Readonly<{
      [key in ThemeHeaderType]: ThemeHeader[];
    }>
  >;

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private snackbarService: SnackbarService,
    private translateService: TranslateService,
    private store: Store,
    private matDialog: MatDialog
  ) {
    this.list$ = this.store.pipe(selectLayoutByKey('list'));
  }

  ngOnInit() {
    this.updateAllTheme();
  }

  updateAllTheme() {
    this.themeService.updateAllTheme();
  }

  routeCreate() {
    this.router.navigate(['theme-edit']);
  }

  onEdit(item: ThemeHeader) {
    const { name, version, type } = item;
    this.router.navigate(['theme-edit'], {
      queryParams: { name, version, type },
    });
  }
  onCopy(item: ThemeHeader) {
    const dialogRef = this.matDialog.open(CopyThemeComponent, {
      data: { themeHeader: item },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (isNotBlank(result)) {
        this.snackbarService.openByI18N('msg.copySuccess');
        this.updateAllTheme();
      }
    });
  }
  onDelete(item: ThemeHeader) {
    this.matDialog
      .open(MessageBoxComponent, {
        data: { message: this.translateService.instant('msg.sureDeleteTheme') },
      })
      .afterClosed()
      .subscribe(result => {
        if (isNotBlank(result)) {
          this.themeService.deleteTheme(item).subscribe(() => {
            this.snackbarService.openByI18N('msg.deleteSuccess');
            this.updateAllTheme();
          });
        }
      });
  }

  navigateList(item: ThemeHeader) {
    this.router.navigate([item.type, item.name, item.version], {
      queryParams: getQueryParamsByHeader(item),
    });
  }

  onOpenVisible() {
    this.matDialog.open(ThemeVisibleComponent);
  }

  onShareTagConfig() {
    this.matDialog.open(ShareTagListComponent, {
      width: '800px',
      maxWidth: '800px',
    });
  }
}
