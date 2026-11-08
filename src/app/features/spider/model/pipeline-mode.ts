import { ExtractionRuleMode } from './extraction.model';
import { ValuePipeline, ValuePipelineType } from './value-pipeline.model';

const pipelineModes: Partial<
  Record<ValuePipelineType, readonly ExtractionRuleMode[]>
> = {
  [ValuePipelineType.EXTRACT_ATTR]: [ExtractionRuleMode.SELECT],
  [ValuePipelineType.EXTRACT_OWN_TEXT]: [ExtractionRuleMode.SELECT],
};

/** 未限制來源的操作可用於所有提取模式。 */
export function isPipelineCompatible(
  type: ValuePipelineType,
  mode: ExtractionRuleMode | undefined
): boolean {
  return (
    mode === undefined ||
    !pipelineModes[type] ||
    pipelineModes[type].includes(mode)
  );
}

/** 逐層檢查物件欄位內的 pipeline，使用各層自己的提取模式。 */
export function areNestedPipelinesCompatible(pipeline: ValuePipeline): boolean {
  if (pipeline.type !== ValuePipelineType.EXTRACT_OBJECTS) return true;
  const config = pipeline.extractObjectsConfig;
  return config.fields.every(field =>
    field.pipelines.every(
      child =>
        isPipelineCompatible(child.type, config.mode) &&
        areNestedPipelinesCompatible(child)
    )
  );
}
