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
      padding: 3rem 2rem;
      background: #ffffff;
      border-radius: 2px;
      border: 1px solid #f0f0f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
      margin: 2rem;
    }
    
    .loading-text {
      margin-top: 1.5rem;
      font-size: 14px;
      font-weight: 500;
      color: #666666;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.02em;
    }
  `]
})
export class LoadingSpinnerComponent {}