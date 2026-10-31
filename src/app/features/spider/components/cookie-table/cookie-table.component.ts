import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  applyEach,
  disabled,
  form,
  FormField,
  required,
  readonly,
} from '@angular/forms/signals';

import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { defer, EMPTY, finalize, Observable, switchMap, take, tap } from 'rxjs';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
} from '../../../../core/model/generic-table';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { Cookie, CookieListMapType, CookieListTO } from '../../model';
import { CookieMode } from '../../model/cookie.model';
import { CookieListMapService } from '../../services/cookie-list-map.service';
import { CookieListService } from '../../services/cookie-list.service';
import { ValuePipelineFormService } from '../../services/value-pipeline-form.service';
import { PipelineListComponent } from '../pipeline-list/pipeline-list.component';
@Component({
  selector: 'app-cookie-table',

  imports: [
    MatTableModule,
    FormField,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    GenericTableComponent,
    TrimOnBlurDirective,
    PipelineListComponent,
  ],
  templateUrl: './cookie-table.component.html',
})
export class CookieTableComponent {
  // inject
  readonly cookieListService = inject(CookieListService);
  readonly cookieListMapService = inject(CookieListMapService);
  readonly selectTableService = inject(SelectTableService);
  readonly messageBoxService = inject(MessageBoxService);
  readonly snackbarService = inject(SnackbarService);
  readonly valuePipelineFormService = inject(ValuePipelineFormService);

  readonly displayedColumns = ['name', 'value'];

  readonly refId = input<string>();
  readonly mapType = input<CookieListMapType>();
  readonly bindingChange = output<boolean>();
  readonly afterSave = output<CookieListTO>();

  readonly cols: GenericTableColumn[] = [
    { key: 'name', label: 'g.name', columnType: GenericColumnType.input },
    { key: 'value', label: 'g.value', columnType: GenericColumnType.input },
  ];

  // signal
  readonly mode = signal<CookieMode>(CookieMode.create);
  readonly isEditMode = computed(() => this.mode() === CookieMode.edit);
  readonly initData = rxResource({
    params: () => {
      const refId = this.refId()?.trim() ?? '';
      const mapType = this.mapType();
      if (isBlank(refId) || !mapType) {
        return undefined;
      }
      return { refId, mapType };
    },
    stream: ({ params }) => {
      if (!params) {
        return EMPTY;
      }
      return this.cookieListService.getByRefIdAndType(
        params.refId,
        params.mapType
      );
    },
    defaultValue: undefined,
  });
  readonly isBinding = linkedSignal<boolean>(() => {
    return !!this.initData.value();
  });
  readonly showBindButton = computed(
    () =>
      this.isEditMode() && isNotBlank(this.refId() ?? '') && !!this.mapType()
  );
  readonly showDeleteButton = computed(
    () => this.isEditMode() && !this.isBinding()
  );

  readonly isProcessing = signal(false);
  readonly formModel = signal({
    cookieId: '',
    description: '',
    list: [] as ReturnType<CookieTableComponent['createCookie']>[],
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    readonly(p, { when: () => this.isProcessing() });
    disabled(p.list, { when: () => this.isProcessing() });
    disabled(p.cookieId, { when: () => this.isEditMode() });
    applyEach(p.list, row => {
      required(row.name);
      required(row.value);
    });
    required(p.cookieId);
  });

  get cookieIdControl() {
    return this.form.cookieId;
  }

  get descriptionControl() {
    return this.form.description;
  }
  get listControl() {
    return this.form.list;
  }

  constructor() {
    effect(() => {
      const data = this.initData.value();
      untracked(() => this.loadItem(data));
    });
  }

  private loadItem(data?: CookieListTO | null) {
    this.form().reset({
      ...structuredClone(this.initialFormValue),
      cookieId: data?.cookieId ?? '',
      description: data?.description ?? '',
      list: (data?.list ?? []).map(row =>
        this.createCookie(structuredClone(row))
      ),
    });
    this.mode.set(data ? CookieMode.edit : CookieMode.create);
  }

  private runOperation<T>(
    operation: () => Observable<T>,
    onSuccess?: (value: T) => void
  ) {
    if (this.isProcessing()) return;
    this.isProcessing.set(true);
    defer(operation)
      .pipe(
        take(1),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({ next: onSuccess, error: () => {} });
  }

  private buildRequest(): CookieListTO | undefined {
    this.form().markAsTouched();
    if (this.form().invalid() || isBlank(this.cookieIdControl().value())) {
      this.snackbarService.isBlankMessage('scrapy.cookieListId');
      return undefined;
    }
    const raw = this.form().value();
    return {
      cookieId: raw.cookieId.trim(),
      description: raw.description.trim(),
      list: structuredClone(raw.list),
    };
  }

  private persistItem(req: CookieListTO) {
    return this.cookieListService.update(req).pipe(
      tap(() => {
        this.mode.set(CookieMode.edit);
        this.afterSave.emit(req);
        this.snackbarService.openI18N('msg.saveSuccess');
      })
    );
  }

  openItemSelector() {
    this.runOperation(
      () =>
        this.cookieListService.getAll().pipe(
          switchMap(data =>
            this.selectTableService.selectSingleCookieList(data)
          ),
          switchMap(item => this.cookieListService.getByCookieId(item.cookieId))
        ),
      item => this.loadItem(item)
    );
  }

  addItem() {
    if (this.isProcessing()) return;
    const req = this.buildRequest();
    if (!req) return;
    this.runOperation(() =>
      this.cookieListService.getAll().pipe(
        switchMap(list => {
          if (list.some(item => item.cookieId === req.cookieId)) {
            return this.messageBoxService
              .openI18N('msg.itemIdExist', {
                params: { text: 'Cookie ID' },
                onlyOk: true,
              })
              .pipe(switchMap(() => EMPTY));
          }
          return this.persistItem(req);
        })
      )
    );
  }

  saveItem() {
    if (this.isProcessing()) return;
    const req = this.buildRequest();
    if (req) this.runOperation(() => this.persistItem(req));
  }

  onClear() {
    this.runOperation(
      () => this.messageBoxService.openI18N('msg.sureClear'),
      result => {
        if (result) this.loadItem();
      }
    );
  }

  toggleBind() {
    const refId = this.refId()?.trim() ?? '';
    const mapType = this.mapType();
    const cookieId = this.cookieIdControl().value().trim();
    if (isBlank(refId) || !mapType || isBlank(cookieId)) return;
    const wasBinding = this.isBinding();
    this.runOperation(
      () =>
        wasBinding
          ? this.cookieListMapService.delete(refId, mapType)
          : this.cookieListMapService.update({
              refId,
              type: mapType,
              cookieId,
            }),
      () => {
        this.isBinding.set(!wasBinding);
        this.bindingChange.emit(!wasBinding);
        this.snackbarService.openI18N(
          wasBinding ? 'msg.unbindSuccess' : 'msg.bindSuccess'
        );
      }
    );
  }

  deleteItem() {
    if (this.isProcessing()) return;
    const cookieId = this.cookieIdControl().value().trim();
    if (isBlank(cookieId)) {
      this.snackbarService.isBlankMessage('scrapy.cookieListId');
      return;
    }
    this.runOperation(
      () =>
        this.cookieListMapService.cookieIsInUse(cookieId).pipe(
          switchMap(inUse =>
            inUse
              ? this.messageBoxService
                  .openI18N('msg.cookieListInUse', { onlyOk: true })
                  .pipe(switchMap(() => EMPTY))
              : this.messageBoxService.openI18N('msg.sureDeleteCookieList')
          ),
          take(1),
          switchMap(result =>
            result ? this.cookieListService.delete(cookieId) : EMPTY
          )
        ),
      () => {
        this.loadItem();
        this.snackbarService.openI18N('msg.deleteSuccess');
      }
    );
  }

  readonly createCookie = (item?: Partial<Cookie>) => {
    return {
      seq: item?.seq ?? 0,
      name: item?.name ?? '',
      value: item?.value ?? '',
      valuePipelines: (item?.valuePipelines ?? []).map(pipeline =>
        this.valuePipelineFormService.createValuePipeline(pipeline)
      ),
    };
  };
}
