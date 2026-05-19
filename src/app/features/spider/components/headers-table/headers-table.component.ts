import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Header, HeadersMapType, HeadersTO, ValuePipeline } from '../../model';
import { MatButtonModule } from '@angular/material/button';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  ControlsOf,
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { HeadersService } from '../../services/headers.service';
import { HeadersMapService } from '../../services/headers-map.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { EMPTY, switchMap } from 'rxjs';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { HeadersMode } from '../../model/headers.model';
import { rxResource } from '@angular/core/rxjs-interop';
import { PipelineListComponent } from '../pipeline-list/pipeline-list.component';
import { ValuePipelineFormService } from '../../services/value-pipeline-form.service';

@Component({
  selector: 'app-headers-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
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
  readonly fb = inject(FormBuilder);

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
        return null;
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
  readonly list = linkedSignal(() => this.initData.value()?.list ?? []);
  readonly isBinding = linkedSignal<boolean>(() => {
    return this.initData.value() !== null;
  });
  readonly showBindButton = computed(
    () =>
      this.isEditMode() && isNotBlank(this.refId() ?? '') && !!this.mapType()
  );
  readonly showDeleteButton = computed(
    () => this.isEditMode() && !this.isBinding()
  );

  readonly form = this.fb.nonNullable.group({
    headersId: ['', [Validators.required]],
    description: [''],
    list: this.fb.array([]),
  });

  get headersIdControl() {
    return this.form.controls.headersId;
  }

  get descriptionControl() {
    return this.form.controls.description;
  }

  get listControl() {
    return this.form.get('list') as ToFormArray<Header>;
  }

  constructor() {
    effect(() => {
      if (this.isEditMode()) {
        this.headersIdControl.disable({ emitEvent: false });
      } else {
        this.headersIdControl.enable({ emitEvent: false });
      }
    });
    effect(() => {
      const data = this.initData.value();
      if (data) {
        this.form.patchValue(data, { emitEvent: false });
        this.setHeadersList(data.list ?? []);
        this.mode.set(HeadersMode.edit);
      } else {
        this.form.reset({ headersId: '', description: '' });
        this.setHeadersList([]);
        this.mode.set(HeadersMode.create);
      }
    });
  }

  openItemSelector() {
    this.headersService
      .getAll()
      .pipe(
        switchMap(data =>
          this.selectTableService.selectSingleHeadersList(data)
        ),
        switchMap(item => this.headersService.getByHeadersId(item.headersId))
      )
      .subscribe(item => {
        this.form.patchValue({
          headersId: item.headersId,
          description: item.description ?? '',
        });
        this.setHeadersList(item.list ?? []);
        this.mode.set(HeadersMode.edit);
      });
  }

  addItem() {
    this.headersIdControl.markAsTouched();
    if (this.form.invalid) {
      this.snackbarService.isBlankMessage('scrapy.headersId');
      return;
    }
    const headersId = this.headersIdControl.getRawValue().trim();
    this.headersService.getAll().subscribe(list => {
      const exist = list.some(x => x.headersId === headersId);
      if (exist) {
        this.messageBoxService.openI18N('msg.itemIdExist', {
          params: { text: 'Headers ID' },
          onlyOk: true,
        });
        return;
      }
      this.saveItem();
    });
  }

  saveItem() {
    this.headersIdControl.markAsTouched();
    if (this.form.invalid) {
      this.snackbarService.isBlankMessage('scrapy.headersId');
      return;
    }
    const req: HeadersTO = {
      headersId: this.headersIdControl.getRawValue().trim(),
      description: this.descriptionControl.getRawValue().trim(),
      list: this.listControl.getRawValue() as Header[],
    };
    this.headersService.update(req).subscribe(() => {
      this.mode.set(HeadersMode.edit);
      this.afterSave.emit(req);
      this.snackbarService.openI18N('msg.saveSuccess');
    });
  }

  onClear() {
    this.messageBoxService.openI18N('msg.sureClear').subscribe(result => {
      if (!result) return;
      this.mode.set(HeadersMode.create);
      this.form.reset({ headersId: '', description: '' });
      this.setHeadersList([]);
    });
  }

  toggleBind() {
    const refId = this.refId()?.trim() ?? '';
    const mapType = this.mapType();
    const headersId = this.headersIdControl.getRawValue().trim();
    if (isBlank(refId) || !mapType || isBlank(headersId)) {
      return;
    }

    if (this.isBinding()) {
      this.headersMapService.delete(refId, mapType).subscribe(() => {
        this.isBinding.set(false);
        this.bindingChange.emit(false);
        this.snackbarService.openI18N('msg.unbindSuccess');
      });
      return;
    }

    this.headersMapService
      .update({ refId, type: mapType, headersId })
      .subscribe(() => {
        this.isBinding.set(true);
        this.bindingChange.emit(true);
        this.snackbarService.openI18N('msg.bindSuccess');
      });
  }

  deleteItem() {
    const headersId = this.headersIdControl.getRawValue().trim();
    if (isBlank(headersId)) {
      this.snackbarService.isBlankMessage('scrapy.headersId');
      return;
    }
    this.headersMapService
      .headersIsInUse(headersId)
      .pipe(
        switchMap(inUse => {
          if (inUse) {
            this.messageBoxService.openI18N('msg.headersListInUse', {
              onlyOk: true,
            });
            return EMPTY;
          }
          return this.messageBoxService.openI18N('msg.sureDeleteHeadersList');
        }),
        switchMap(result => {
          if (!result) return EMPTY;
          return this.headersService.delete(headersId);
        })
      )
      .subscribe(() => {
        this.mode.set(HeadersMode.create);
        this.form.reset({ headersId: '', description: '' });
        this.setHeadersList([]);
        this.snackbarService.openI18N('msg.deleteSuccess');
      });
  }

  private setHeadersList(list: Header[]) {
    const formArray = this.listControl;
    formArray.clear();
    this.list.set(list);
  }

  readonly createHeadersGroup = (item?: Partial<Header>) => {
    return this.fb.nonNullable.group({
      seq: [item?.seq ?? 0],
      name: [item?.name ?? '', [Validators.required]],
      value: [item?.value ?? '', [Validators.required]],
      valuePipelines: this.fb.nonNullable.array<
        FormGroup<ControlsOf<ValuePipeline>>
      >(
        (item?.valuePipelines ?? []).map(pipeline =>
          this.valuePipelineFormService.createValuePipelineGroup(pipeline)
        )
      ),
    }) as FormGroup<ControlsOf<Header>>;
  };
}
