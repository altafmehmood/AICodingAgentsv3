import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-content>
        <div class="error-content">
          <mat-icon color="warn" class="error-icon">error</mat-icon>
          <h3>Something went wrong</h3>
          <p>{{ message }}</p>
          <button mat-raised-button color="warn" (click)="onRetry()">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 32px;
    }
    
    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    h3 {
      margin: 0 0 16px 0;
    }
    
    p {
      margin: 0 0 32px 0;
      max-width: 400px;
    }
    
    button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class ErrorDisplayComponent {
  @Input() message: string = 'An unexpected error occurred. Please try again.';
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}