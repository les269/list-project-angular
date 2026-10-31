import { DatasetField, DatasetFieldType } from '../model';

export const createDatasetField = (data: Partial<DatasetField> = {}) => {
  return {
    seq: 0,
    type: DatasetFieldType.path,
    key: '',
    label: '',
    fixedString: '',
    replaceRegular: '',
    replaceRegularTo: '',
    ...data,
  };
};
