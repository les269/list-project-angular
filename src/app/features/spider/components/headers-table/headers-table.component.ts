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
import { TranslatePipe } from '@ngx-translate/core';
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
import { Header, HeadersMapType, HeadersTO } from '../../model';
import { HeadersMode } from '../../model/headers.model';
import { HeadersMapService } from '../../services/headers-map.service';
import { HeadersService } from '../../services/headers.service';
import { ValuePipelineFormService } from '../../services/value-pipeline-form.service';
import { PipelineListComponent } from '../pipeline-list/pipeline-list.component';

@Component({
  selector: 'app-headers-table',

  imports: [
    MatTableModule,
    FormField,
    TranslatePipe,
    MatIconModule,
    MatButtonModule,
    GenericTableComponent,
    TrimOnBlurDirective,
    PipelineListComponent,
  ],
  templateUrl: './headers-table.component.html',
})
export class HeadersTableComponent {
  readonly headersService = inject(HeadersService);
  readonly headersMapService = inject(HeadersMapService);
  readonly selectTableService = inject(SelectTableService);
  readonly messageBoxService = inject(MessageBoxService);
  readonly snackbarService = inject(SnackbarService);
  readonly valuePipelineFormService = inject(ValuePipelineFormService);

  readonly displayedColumns = ['name', 'value'];

  readonly refId = input<string>();
  readonly mapType = input<HeadersMapType>();
  readonly bindingChange = output<boolean>();
  readonly afterSave = output<HeadersTO>();

  readonly cols: GenericTableColumn[] = [
    { key: 'name', label: 'g.name', columnType: GenericColumnType.input },
    { key: 'value', label: 'g.value', columnType: GenericColumnType.input },
  ];

  readonly mode = signal<HeadersMode>(HeadersMode.create);
  readonly isEditMode = computed(() => this.mode() === HeadersMode.edit);
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
      return this.headersService.getByRefIdAndType(
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
    headersId: '',
    description: '',
    list: [] as ReturnType<HeadersTableComponent['createHeader']>[],
  });
  readonly initialFormValue = structuredClone(this.formModel());
  readonly form = form(this.formModel, p => {
    readonly(p, { when: () => this.isProcessing() });
    disabled(p.list, { when: () => this.isProcessing() });
    disabled(p.headersId, { when: () => this.isEditMode() });
    applyEach(p.list, row => {
      required(row.name);
      required(row.value);
    });
    required(p.headersId);
  });

  get headersIdControl() {
    return this.form.headersId;
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

  private loadItem(data?: HeadersTO | null) {
    this.form().reset({
      ...structuredClone(this.initialFormValue),
      headersId: data?.headersId ?? '',
      description: data?.description ?? '',
      list: (data?.list ?? []).map(row =>
        this.createHeader(structuredClone(row))
      ),
    });
    this.mode.set(data ? HeadersMode.edit : HeadersMode.create);
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

  private buildRequest(): HeadersTO | undefined {
    this.form().markAsTouched();
    if (this.form().invalid() || isBlank(this.headersIdControl().value())) {
      this.snackbarService.isBlankMessage('scrapy.headersId');
      return undefined;
    }
    const raw = this.form().value();
    return {
      headersId: raw.headersId.trim(),
      description: raw.description.trim(),
      list: structuredClone(raw.list),
    };
  }

  private persistItem(req: HeadersTO) {
    return this.headersService.update(req).pipe(
      tap(() => {
        this.mode.set(HeadersMode.edit);
        this.afterSave.emit(req);
        this.snackbarService.openI18N('msg.saveSuccess');
      })
    );
  }

  openItemSelector() {
    this.runOperation(
      () =>
        this.headersService.getAll().pipe(
          switchMap(data =>
            this.selectTableService.selectSingleHeadersList(data)
          ),
          switchMap(item => this.headersService.getByHeadersId(item.headersId))
        ),
      item => this.loadItem(item)
    );
  }

  addItem() {
    if (this.isProcessing()) return;
    const req = this.buildRequest();
    if (!req) return;
    this.runOperation(() =>
      this.headersService.getAll().pipe(
        switchMap(list => {
          if (list.some(item => item.headersId === req.headersId)) {
            return this.messageBoxService
              .openI18N('msg.itemIdExist', {
                params: { text: 'Header ID' },
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
    const headersId = this.headersIdControl().value().trim();
    if (isBlank(refId) || !mapType || isBlank(headersId)) return;
    const wasBinding = this.isBinding();
    this.runOperation(
      () =>
        wasBinding
          ? this.headersMapService.delete(refId, mapType)
          : this.headersMapService.update({ refId, type: mapType, headersId }),
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
    const headersId = this.headersIdControl().value().trim();
    if (isBlank(headersId)) {
      this.snackbarService.isBlankMessage('scrapy.headersId');
      return;
    }
    this.runOperation(
      () =>
        this.headersMapService.headersIsInUse(headersId).pipe(
          switchMap(inUse =>
            inUse
              ? this.messageBoxService
                  .openI18N('msg.headersListInUse', { onlyOk: true })
                  .pipe(switchMap(() => EMPTY))
              : this.messageBoxService.openI18N('msg.sureDeleteHeadersList')
          ),
          take(1),
          switchMap(result =>
            result ? this.headersService.delete(headersId) : EMPTY
          )
        ),
      () => {
        this.loadItem();
        this.snackbarService.openI18N('msg.deleteSuccess');
      }
    );
  }

  readonly createHeader = (item?: Partial<Header>) => {
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
