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
import { MessageBoxComponent } from '../../../../core/components/message-box.component';
import { CopyThemeComponent } from '../../components/copy-theme.dialog';
import { isNotBlank } from '../../../../shared/util/helper';
import { selectLayoutByKey } from '../../../../shared/state/layout.selectors';
import { Observable } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule],
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrl: 'home.component.scss',
})
export class HomeComponent implements OnInit {
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
    this.getList();
  }

  getList() {
    this.themeService.getAllTheme().subscribe(res => {
      this.store.dispatch(
        updateList({
          [ThemeHeaderType.imageList]: res.filter(
            x => x.type === ThemeHeaderType.imageList
          ),
          [ThemeHeaderType.table]: res.filter(
            x => x.type === ThemeHeaderType.table
          ),
        })
      );
    });
  }

  routeCreate() {
    this.router.navigate(['theme-edit']);
  }

  onEdit(item: ThemeHeader) {
    this.router.navigate(['theme-edit'], { queryParams: item });
  }
  onCopy(item: ThemeHeader) {
    const dialogRef = this.matDialog.open(CopyThemeComponent, {
      data: { themeHeader: item },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (isNotBlank(result)) {
        this.snackbarService.openByI18N('msg.copySuccess');
        this.getList();
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
            this.snackbarService.openByI18N('msg.deletSuccess');
            this.getList();
          });
        }
      });
  }

  navigateList(item: ThemeHeader) {
    this.router.navigate(['imageList', item.name, item.version]);
  }
}
