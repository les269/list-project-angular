import { SignalFieldType } from '../../../../core/model/signal-field.model';
import { Component, computed, inject, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
} from '../../../../core/model/generic-table';
import {
  ExtractionRule,
  ExtractionRuleMode,
  ExtractionStepCondition,
} from '../../model';
import { ExtractionRuleFormService } from '../../services/extraction-rule-form.service';
import { PipelineListComponent } from '../pipeline-list/pipeline-list.component';
import { SignalFieldComponent } from '../../../../core/components/signal-field/signal-field.component';
import { toSignalFieldOptions } from '../../../../shared/util/signal-field';

@Component({
  selector: 'app-extraction-rules',
  imports: [
    TranslateModule,
    GenericTableComponent,
    PipelineListComponent,
    SignalFieldComponent,
  ],
  templateUrl: './extraction-rules.component.html',
})
export class ExtractionRulesComponent {
  readonly fieldType = SignalFieldType;
  readonly fields = input.required<FieldTree<ExtractionRule[]>>();
  readonly mode = input.required<FieldTree<ExtractionRuleMode>>();
  readonly showHelp = input(false);
  private readonly ruleForm = inject(ExtractionRuleFormService);
  readonly modeOptions = toSignalFieldOptions(
    ExtractionRuleMode,
    'spider.extractionRuleMode'
  );
  readonly conditionOptions = toSignalFieldOptions(
    ExtractionStepCondition,
    'spider.condition'
  );
  readonly displayedColumns = computed(() =>
    this.mode()().value() === ExtractionRuleMode.JSON_PATH
      ? this.jsonPathDisplayedColumns
      : this.selectorDisplayedColumns
  );
  readonly extractionStepCondition = ExtractionStepCondition;
  readonly extractionRuleMode = ExtractionRuleMode;
  readonly selectorDisplayedColumns = ['key', 'selector'];
  readonly jsonPathDisplayedColumns = ['key', 'jsonPath'];
  readonly ruleColumns: GenericTableColumn[] = [
    { key: 'key', label: 'spider.key', columnType: GenericColumnType.input },
    {
      key: 'selector',
      label: 'spider.selector',
      columnType: GenericColumnType.textarea,
      width: '70%',
    },
    {
      key: 'jsonPath',
      label: 'spider.jsonPath',
      columnType: GenericColumnType.textarea,
      width: '70%',
    },
  ];
  shouldShowValueInput(condition: ExtractionStepCondition): boolean {
    const valueConditions = [
      ExtractionStepCondition.CONTAINS,
      ExtractionStepCondition.NOT_CONTAINS,
      ExtractionStepCondition.EQUALS,
      ExtractionStepCondition.NOT_EQUALS,
      ExtractionStepCondition.MATCHES,
      ExtractionStepCondition.NOT_MATCHES,
    ];
    return valueConditions.includes(condition);
  }
  shouldShowIgnoreCase(condition: ExtractionStepCondition): boolean {
    const patternConditions = [
      ExtractionStepCondition.CONTAINS,
      ExtractionStepCondition.NOT_CONTAINS,
      ExtractionStepCondition.EQUALS,
      ExtractionStepCondition.NOT_EQUALS,
    ];
    return patternConditions.includes(condition);
  }

  readonly createRule = (data?: Partial<ExtractionRule>) =>
    this.ruleForm.createRule(data);
}
