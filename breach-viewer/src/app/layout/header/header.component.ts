import { Component, Output, EventEmitter } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <header class="header-toolbar">
      <div class="header-content">
        <div class="app-title">
          <mat-icon class="app-icon">security</mat-icon>
          <h1 class="app-name">BreachViewer</h1>
        </div>
        <button mat-raised-button class="export-button" (click)="onExportPdf()">
          <mat-icon>download</mat-icon>
          Export PDF
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #ffffff;
      border-bottom: 1px solid #f0f0f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      height: 80px;
    }
    
    .app-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .app-icon {
      color: #184B29;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    
    .app-name {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 500;
      color: #2c2c2c;
      margin: 0;
      letter-spacing: -0.5px;
    }
    
    .export-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #184B29;
      color: white;
      border: none;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 500;
      padding: 12px 24px;
      border-radius: 2px;
      transition: all 0.2s ease;
      letter-spacing: 0.02em;
    }
    
    .export-button:hover {
      background: #0f3319;
      box-shadow: 0 2px 4px rgba(24, 75, 41, 0.2);
    }
    
    .export-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    @media (max-width: 768px) {
      .header-content {
        padding: 0 1rem;
      }
      
      .app-name {
        font-size: 20px;
      }
      
      .export-button {
        padding: 10px 16px;
        font-size: 13px;
      }
    }
  `]
})
export class HeaderComponent {
  @Output() exportPdf = new EventEmitter<void>();

  onExportPdf(): void {
    this.exportPdf.emit();
  }
}