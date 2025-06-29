import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-container">
      <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
      <p class="loading-text">Loading breaches...</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 32px;
    }
    
    .loading-text {
      margin-top: 16px;
    }
  `]
})
export class LoadingSpinnerComponent {}