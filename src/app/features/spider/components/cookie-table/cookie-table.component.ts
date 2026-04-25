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
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Cookie, CookieListMapType, CookieListTO } from '../../model';
import { MatButtonModule } from '@angular/material/button';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { CookieListService } from '../../services/cookie-list.service';
import { CookieListMapService } from '../../services/cookie-list-map.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { EMPTY, switchMap } from 'rxjs';
import { isBlank, isNotBlank } from '../../../../shared/util/helper';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';
import { CookieMode } from '../../model/cookie.model';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-cookie-table',
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
  readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['name', 'value'];

  // formArray = input<ToFormArray<Cookie>>();
  // initData = input<Cookie[]>();
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
        return null;
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
    cookieId: ['', [Validators.required]],
    description: [''],
    list: this.fb.array([]),
  });

  get cookieIdControl() {
    return this.form.controls.cookieId;
  }

  get descriptionControl() {
    return this.form.controls.description;
  }
  get listControl() {
    return this.form.get('list') as ToFormArray<Cookie>;
  }

  constructor() {
    effect(() => {
      if (this.isEditMode()) {
        this.cookieIdControl.disable({ emitEvent: false });
      } else {
        this.cookieIdControl.enable({ emitEvent: false });
      }
    });
    effect(() => {
      const data = this.initData.value();
      if (data) {
        this.form.patchValue(data, { emitEvent: false });
        this.setCookieList(data.list ?? []);
        this.mode.set(CookieMode.edit);
      } else {
        this.form.reset({ cookieId: '', description: '' });
        this.setCookieList([]);
        this.mode.set(CookieMode.create);
      }
    });
  }

  openItemSelector() {
    this.cookieListService
      .getAll()
      .pipe(
        switchMap(data => this.selectTableService.selectSingleCookieList(data)),
        switchMap(item => this.cookieListService.getByCookieId(item.cookieId))
      )
      .subscribe(item => {
        this.form.patchValue({
          cookieId: item.cookieId,
          description: item.description ?? '',
        });
        this.setCookieList(item.list ?? []);
        this.mode.set(CookieMode.edit);
      });
  }

  addItem() {
    this.cookieIdControl.markAsTouched();
    if (this.form.invalid) {
      this.snackbarService.isBlankMessage('scrapy.cookieListId');
      return;
    }
    const cookieId = this.cookieIdControl.getRawValue().trim();
    this.cookieListService.getAll().subscribe(list => {
      const exist = list.some(x => x.cookieId === cookieId);
      if (exist) {
        this.messageBoxService.openI18N('msg.itemIdExist', {
          params: { text: 'Cookie ID' },
          onlyOk: true,
        });
        return;
      }
      this.saveItem();
    });
  }

  saveItem() {
    this.cookieIdControl.markAsTouched();
    if (this.form.invalid) {
      this.snackbarService.isBlankMessage('scrapy.cookieListId');
      return;
    }
    const req: CookieListTO = {
      cookieId: this.cookieIdControl.getRawValue().trim(),
      description: this.descriptionControl.getRawValue().trim(),
      list: this.listControl.getRawValue() as Cookie[],
    };
    this.cookieListService.update(req).subscribe(() => {
      this.mode.set(CookieMode.edit);
      this.afterSave.emit(req);
      this.snackbarService.openI18N('msg.saveSuccess');
    });
  }

  onClear() {
    this.messageBoxService.openI18N('msg.sureClear').subscribe(result => {
      if (!result) return;
      this.mode.set(CookieMode.create);
      this.form.reset({ cookieId: '', description: '' });
      this.setCookieList([]);
    });
  }

  toggleBind() {
    const refId = this.refId()?.trim() ?? '';
    const mapType = this.mapType();
    const cookieId = this.cookieIdControl.getRawValue().trim();
    if (isBlank(refId) || !mapType || isBlank(cookieId)) {
      return;
    }

    if (this.isBinding()) {
      this.cookieListMapService.delete(refId, mapType).subscribe(() => {
        this.isBinding.set(false);
        this.bindingChange.emit(false);
        this.snackbarService.openI18N('msg.unbindSuccess');
      });
      return;
    }

    this.cookieListMapService
      .update({ refId, type: mapType, cookieId })
      .subscribe(() => {
        this.isBinding.set(true);
        this.bindingChange.emit(true);
        this.snackbarService.openI18N('msg.bindSuccess');
      });
  }

  deleteItem() {
    const cookieId = this.cookieIdControl.getRawValue().trim();
    if (isBlank(cookieId)) {
      this.snackbarService.isBlankMessage('scrapy.cookieListId');
      return;
    }
    this.cookieListMapService
      .cookieIsInUse(cookieId)
      .pipe(
        switchMap(inUse => {
          if (inUse) {
            this.messageBoxService.openI18N('msg.cookieListInUse', {
              onlyOk: true,
            });
            return EMPTY;
          }
          return this.messageBoxService.openI18N('msg.sureDeleteCookieList');
        }),
        switchMap(result => {
          if (!result) return EMPTY;
          return this.cookieListService.delete(cookieId);
        })
      )
      .subscribe(() => {
        this.mode.set(CookieMode.create);
        this.form.reset({ cookieId: '', description: '' });
        this.setCookieList([]);
        this.snackbarService.openI18N('msg.deleteSuccess');
      });
  }

  private setCookieList(list: Cookie[]) {
    const formArray = this.listControl;
    formArray.clear();
    this.list.set(list);
  }

  readonly createGroup = (item?: Cookie) => {
    return this.fb.nonNullable.group({
      seq: [item?.seq ?? 0],
      name: [item?.name ?? '', [Validators.required]],
      value: [item?.value ?? '', [Validators.required]],
    });
  };
}
