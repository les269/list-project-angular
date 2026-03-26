import { Component, input } from '@angular/core';
import { FormAlert } from '../../model';
import { MatIconModule } from '@angular/material/icon';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-alerts',
  imports: [MatIconModule],
  templateUrl: './form-alerts.component.html',
  styleUrl: './form-alerts.component.scss',
})
export class FormAlertsComponent {
  readonly form = input.required<AbstractControl>();
  readonly formAlerts = input.required<FormAlert[]>();
}
