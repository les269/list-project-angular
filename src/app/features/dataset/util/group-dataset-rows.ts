import {
  GroupDatasetField,
  GroupDatasetFieldType,
  GroupDatasetApi,
  GroupDatasetSpider,
} from '../model';

export const createGroupDatasetField = (
  data: Partial<GroupDatasetField> = {}
) => {
  return {
    seq: data.seq ?? 0,
    type: data.type ?? GroupDatasetFieldType.string,
    key: data.key ?? '',
    label: data.label ?? '',
    required: data.required ?? false,
  };
};

export const createGroupDatasetApi = (data: Partial<GroupDatasetApi> = {}) => {
  return {
    seq: 0,
    ...data,
    apiId: data.apiId ?? '',
    label: data.label ?? '',
  };
};

export const createGroupDatasetSpider = (
  data: Partial<GroupDatasetSpider> = {}
) => {
  return {
    seq: 0,
    spiderId: '',
    label: '',
    isDefault: false,
    visibleJson: false,
    visibleUrl: false,
    ...data,
  };
};
