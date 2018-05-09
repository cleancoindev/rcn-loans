import { Component, Input } from '@angular/core';

import { Loan } from './../../loan.model';

// App Services
import { ContractsService } from './../../contracts.service';
import { TxService, Tx } from './../../tx.service';

@Component({
  selector: 'lend-button',
  templateUrl: './lend-button.component.html',
  styleUrls: ['./lend-button.component.scss']
})
export class LendButtonComponent {
  @Input() loan: Loan;

  constructor(
    private contractsService: ContractsService,
    private txService: TxService,
  ) {}

  handleLend() {
    this.contractsService.lendLoan(this.loan).then(tx => {
      console.log("Lent loan", tx);
      this.txService.registerLendTx(this.loan, tx);
    })
  }

  get enabled(): Boolean {
    return this.txService.getLastLend(this.loan) !== undefined;
  }

  get buttonText(): string {
    let tx = this.txService.getLastLend(this.loan);
    
    if (tx === undefined) {
      return "Lend";
    }

    if (tx.confirmed) {
      return "Lent";
    }

    return "Lending...";
  }
}
