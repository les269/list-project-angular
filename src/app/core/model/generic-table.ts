import { Observable } from 'rxjs';
import { FieldTree } from '@angular/forms/signals';

/** 表格列操作共用的結構，業務欄位保留動態型別。 */
export interface GenericTableRow {
  seq: number;
  [key: string]: unknown;
}

// 將動態 Signal Forms 的型別交界集中於此，讓呼叫端沿用各自的 schema。
export type GenericTableFields = FieldTree<any[]>;
export type GenericTableRowField = GenericTableFields[number];
export type GenericTableRowFactory = (data?: any) => GenericTableRow;

export interface GenericTableRowContext {
  $implicit: GenericTableRowField;
  index: number;
}

export interface GenericTableCellContext extends GenericTableRowContext {
  col: GenericTableColumn;
}

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
