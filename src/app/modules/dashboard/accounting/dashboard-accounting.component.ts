import { Component } from '@angular/core';
import { AccountsPayableListComponent } from '../../accounts-payable/list/accounts-payable-list.component';

@Component({
  selector: 'app-dashboard-accounting',
  standalone: true,
  imports: [AccountsPayableListComponent],
  templateUrl: './dashboard-accounting.component.html'
})
export class DashboardAccountingComponent {}
