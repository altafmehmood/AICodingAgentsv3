import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-container">
      <mat-progress-spinner diameter="50" mode="indeterminate"></mat-progress-spinner>
      <p class="loading-text">Loading breaches...</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    
    .loading-text {
      margin-top: 1rem;
      color: #666;
      font-size: 0.875rem;
    }
  `]
})
export class LoadingSpinnerComponent {}