import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent {}
