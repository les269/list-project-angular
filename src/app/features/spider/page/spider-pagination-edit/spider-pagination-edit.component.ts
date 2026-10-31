import { CommonModule } from '@angular/common';
import { Component, computed, inject, linkedSignal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  debounce,
  disabled,
  form,
  FormField,
  required,
} from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, filter, map, switchMap } from 'rxjs';
import { EditMode } from '../../../../core/model';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isNotBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import {
  CookieTableDialogComponent,
  CookieTableDialogData,
} from '../../components/cookie-table-dialog/cookie-table-dialog.component';
import {
  HeadersTableDialogComponent,
  HeadersTableDialogData,
} from '../../components/headers-table-dialog/headers-table-dialog.component';
import {
  CookieListMapType,
  ExtractionRuleMode,
  HeadersMapType,
  SpiderPagination,
} from '../../model';
import { SpiderPaginationService } from '../../services';

@Component({
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    FormField,
    TrimOnBlurDirective,
  ],
  selector: 'app-spider-pagination-edit',
  templateUrl: './spider-pagination-edit.component.html',
})
export class SpiderPaginationEditComponent {
  //inject
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly spiderPaginationService = inject(SpiderPaginationService);
  readonly matDialog = inject(MatDialog);
  readonly snackbarService = inject(SnackbarService);

  //signal
  readonly status = computed<EditMode>(() =>
    this.spiderPaginationId() ? this.editMode.EDIT : this.editMode.CREATE
  );
  readonly spiderPaginationId = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('spiderPaginationId')),
      filter(spiderPaginationId => isNotBlank(spiderPaginationId))
    ),
    { initialValue: undefined }
  );
  readonly spiderPagination = rxResource({
    params: () => this.spiderPaginationId(),
    stream: ({ params }) => {
      if (!params) {
        return EMPTY;
      }
      return this.spiderPaginationService.getById(params);
    },
    defaultValue: undefined,
  });
  readonly model = linkedSignal(() => {
    const value = this.spiderPagination.value();
    if (value) {
      return value;
    }
    return {
      spiderPaginationId: '',
      paginationConfig: {
        perStartParams: [],
        startUrl: '',
        nextPageUrlKey: '',
        extractionRuleMode: ExtractionRuleMode.SELECT,
        extractionRuleList: [],
      },
    } satisfies SpiderPagination;
  });
  readonly form = form(this.model, schemaPath => {
    required(schemaPath.spiderPaginationId);
    debounce(schemaPath.paginationConfig.startUrl, 300);
    debounce(schemaPath.paginationConfig.nextPageUrlKey, 300);
    disabled(schemaPath.spiderPaginationId, { when: () => this.isEditMode });
  });
  // constants
  readonly editMode = EditMode;
  readonly extractionRuleMode = ExtractionRuleMode;

  get isCreateMode() {
    return this.status() === this.editMode.CREATE;
  }
  get isEditMode() {
    return this.status() === this.editMode.EDIT;
  }

  onCookiesDialog() {
    const data: CookieTableDialogData = {
      refId: this.form.spiderPaginationId().value() ?? '',
      mapType: CookieListMapType.SPIDER_PAGINATION,
    };
    this.matDialog.open(CookieTableDialogComponent, {
      data,
      minWidth: '60vw',
      autoFocus: false,
    });
  }

  onHeadersDialog() {
    const data: HeadersTableDialogData = {
      refId: this.form.spiderPaginationId().value() ?? '',
      mapType: HeadersMapType.SPIDER_PAGINATION,
    };
    this.matDialog.open(HeadersTableDialogComponent, {
      data,
      minWidth: '60vw',
      autoFocus: false,
    });
  }

  update() {
    const formState = this.form();
    if (formState.invalid()) {
      formState.markAsTouched();
      return;
    }
    const id = this.form.spiderPaginationId().value();
    this.spiderPaginationService
      .isInUse(id ?? '')
      .pipe(
        switchMap(exist => {
          if (this.isCreateMode && exist) {
            this.snackbarService.openI18N('msg.spiderExist');
            return EMPTY;
          }
          if (this.isEditMode && !exist) {
            this.snackbarService.openI18N('msg.spiderNotExist');
            return EMPTY;
          }
          return this.spiderPaginationService.update(this.model());
        })
      )
      .subscribe(() => {
        if (this.isCreateMode) {
          this.router.navigate(['spider-pagination-edit', id], {
            replaceUrl: true,
          });
        }
        this.snackbarService.openI18N('msg.saveSuccess');
      });
  }

  onBack() {
    this.router.navigate(['spider-pagination-list']);
  }
}
