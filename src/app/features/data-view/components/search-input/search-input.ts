import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { SearchMode } from '../../models/search.model';
import { TrimOnBlurDirective } from '../../../../shared/util/util.directive';

@Component({
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
    TrimOnBlurDirective,
  ],
  selector: 'app-search-input',
  styleUrl: './search-input.scss',
  templateUrl: './search-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  readonly value = model('');
  readonly suggestions = input<string[]>([]);
  readonly search = output<string>();
  readonly searchMode = model<SearchMode>('or');

  toggleSearchMode() {
    this.searchMode.update(mode => (mode === 'or' ? 'and' : 'or'));
    this.search.emit(this.value());
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.isComposing) {
      this.search.emit(this.value());
    }
  }

  clear(input: HTMLInputElement) {
    this.value.set('');
    this.search.emit('');
    input.focus();
  }
}
