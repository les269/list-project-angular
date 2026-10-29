import { Component, input } from '@angular/core';
import { FieldState } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { hasFieldError } from '../../../shared/util/signal-form';
import { FormAlert } from '../../model';

@Component({
  selector: 'app-form-alerts',
  imports: [MatIconModule],
  templateUrl: './form-alerts.component.html',
})
export class FormAlertsComponent {
  readonly hasError = hasFieldError;
  readonly form = input.required<() => FieldState<any>>();
  readonly formAlerts = input.required<FormAlert[]>();
}
