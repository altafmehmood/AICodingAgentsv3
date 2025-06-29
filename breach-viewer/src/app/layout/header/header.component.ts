import { Component, Output, EventEmitter } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>security</mat-icon>
      <span>BreachViewer</span>
      <span class="spacer"></span>
      <button mat-raised-button color="accent" (click)="onExportPdf()">
        <mat-icon>download</mat-icon>
        Export PDF
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
  `]
})
export class HeaderComponent {
  @Output() exportPdf = new EventEmitter<void>();

  onExportPdf(): void {
    this.exportPdf.emit();
  }
}