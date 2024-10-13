import { Component, OnInit } from '@angular/core';
import { ThemeHeader, ThemeHeaderType } from '../../models';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { updateTitle } from '../../../../shared/state/layout.actions';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../core/components/message-box.component';
import { CopyThemeComponent } from '../../components/copy-theme.dialog';
import { getHeaderId, isNotBlank } from '../../../../shared/util/helper';

@Component({
  standalone: true,
  imports: [CommonModule, TranslateModule],
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrl: 'home.component.scss',
})
export class HomeComponent implements OnInit {
  eThemeHeaderType = ThemeHeaderType;
  list: {
    [key in ThemeHeaderType]: ThemeHeader[];
  } = {
    [ThemeHeaderType.imageList]: [],
    [ThemeHeaderType.list]: [],
    [ThemeHeaderType.table]: [],
  };

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private snackbarService: SnackbarService,
    private translateService: TranslateService,
    private store: Store,
    private matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.translateService.get('title.home').subscribe(title => {
      this.store.dispatch(updateTitle({ title }));
      document.title = title;
    });
    this.getList();
  }

  getList() {
    this.themeService.getAllTheme().subscribe(res => {
      this.clearList();
      for (const value of res) {
        this.list[value.type].push(value);
      }
      console.log(this.list);
    });
  }

  clearList() {
    for (const key of Object.keys(ThemeHeaderType)) {
      const value = ThemeHeaderType[key as keyof typeof ThemeHeaderType];
      this.list[value] = [];
    }
  }

  routeCreate() {
    this.router.navigate(['edit']);
  }

  onEdit(item: ThemeHeader) {
    this.router.navigate(['edit'], { queryParams: item });
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
    const dialogRef = this.matDialog.open(MessageBoxComponent, {
      data: { message: this.translateService.instant('msg.sureDeleteTheme') },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (isNotBlank(result)) {
        this.themeService.deleteTheme(item).subscribe(() => {
          this.snackbarService.openByI18N('msg.deletSuccess');
          this.getList();
        });
      }
    });
  }

  navigateList(item: ThemeHeader) {
    this.router.navigate(['image-list'], {
      queryParams: { headerId: getHeaderId(item) },
    });
  }
}
