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
    seq: 0,
    type: GroupDatasetFieldType.string,
    key: '',
    label: '',
    replaceValueMapName: '',
    ...data,
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
