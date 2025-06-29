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
      padding: 3rem 2rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    .loading-text {
      margin-top: 1.5rem;
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 500;
    }
  `]
})
export class LoadingSpinnerComponent {}