import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

// export type ControlsOf<T extends Record<string, any>> = {
//   [K in keyof T]: FormControl<T[K]>;
// };
type MapToFormArray<T> = T extends Record<string, any>[]
  ? FormArray<FormGroup<ControlsOf<T[number]>>>
  : FormArray<FormControl<T>>;
export type ControlsOf<T> = {
  [K in keyof T]: T[K] extends any[]
    ? MapToFormArray<T[K]> // 處理陣列
    : T[K] extends Record<string, any>
      ? FormGroup<ControlsOf<T[K]>> // 處理巢狀物件
      : FormControl<T[K]>; // 處理基本型別
};
export type ToFormArray<T extends Record<string, any>> = FormArray<
  FormGroup<ControlsOf<T>>
>;
type BaseColumn = {
  key: string;
  label: string;
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  error?: ErrorMsg[];
};
export type ErrorMsg = {
  name: string;
  msg: string;
};

export type SelectColumn<T> = BaseColumn & {
  columnType: GenericColumnType.select;
  data: T[];
  dataValue: keyof T;
  dataLabel: (item: T) => string;
};
export type ChipSelectColumn<T> = BaseColumn & {
  columnType: GenericColumnType.chipSelect;
  data: T[];
  dataValue: keyof T;
  dataLabel: (item: T) => string;
  openDialog: () => Observable<T>;
  required?: boolean;
  requiredMsg?: string;
};
export type ChipSelectMultipleColumn<T> = BaseColumn & {
  columnType: GenericColumnType.chipSelectMultiple;
  data: T[];
  dataValue: keyof T;
  dataLabel: (item: T) => string;
  openDialog: (selected: T[]) => Observable<T[]>;
  required?: boolean;
  requiredMsg?: string;
};
export type InputColumn = BaseColumn & {
  columnType: GenericColumnType.input;
  require?: boolean;
};
export type TextareaColumn = BaseColumn & {
  columnType: GenericColumnType.textarea;
};
export type CheckboxColumn = BaseColumn & {
  columnType: GenericColumnType.checkbox;
};
export type RadioColumn = BaseColumn & {
  columnType: GenericColumnType.radio;
};

export type CustomColumn = BaseColumn & {
  columnType: GenericColumnType.custom;
};
export type GenericTableColumn<T = any> =
  | InputColumn
  | TextareaColumn
  | CustomColumn
  | CheckboxColumn
  | RadioColumn
  | SelectColumn<T>
  | ChipSelectColumn<T>
  | ChipSelectMultipleColumn<T>;

export enum GenericColumnType {
  input = 'input',
  textarea = 'textarea',
  select = 'select',
  checkbox = 'checkbox',
  radio = 'radio',
  chipSelect = 'chipSelect',
  chipSelectMultiple = 'chipSelectMultiple',
  custom = 'custom',
}
