export enum SignalFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  CHIPS = 'chips',
  DATE = 'date',
}

export interface SignalFieldOption {
  value: string;
  label: string;
}
