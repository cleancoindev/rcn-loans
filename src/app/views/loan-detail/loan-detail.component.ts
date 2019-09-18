import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatDialog } from '@angular/material';
import { DialogSelectCurrencyComponent } from '../../dialogs/dialog-select-currency/dialog-select-currency.component';
// App Models
import { Loan, Status, Network } from './../../models/loan.model';
import { Brand } from '../../models/brand.model';
// App Utils
import { Utils } from './../../utils/utils';
// App Services
import { ContractsService } from './../../services/contracts.service';
import { CosignerService } from './../../services/cosigner.service';
import { IdentityService } from '../../services/identity.service';
import { Web3Service } from '../../services/web3.service';
import { BrandingService } from './../../services/branding.service';

@Component({
  selector: 'app-loan-detail',
  templateUrl: './loan-detail.component.html',
  styleUrls: ['./loan-detail.component.scss']
})
export class LoanDetailComponent implements OnInit {
  loan: Loan;
  identityName = '...';
  viewDetail = undefined;
  userAccount: string;
  brand: Brand;

  diasporeData = [];
  isDiaspore: boolean;

  loanConfigData = [];
  loanStatusData = [];
  interestMiddleText: string;
  isExpired: boolean;
  isRequest: boolean;
  isOngoing: boolean;
  isInDebt: boolean;

  canTransfer = false;
  canCancel: boolean;
  canPay: boolean;
  canLend: boolean;

  hasHistory: boolean;
  generatedByUser: boolean;

  totalDebt: string;
  pendingAmount: string;
  expectedReturn: string;
  paid: string;

  interest: string;
  duration: string;
  nextInstallment: {
    installment: string,
    amount: string,
    dueDate: string,
    dueTime: string
  };
  lendDate: string;
  dueDate: string;
  liquidationRatio: string;
  balanceRatio: string;
  punitory: string;

  // Loan Oracle
  oracle: string;
  availableOracle: boolean;
  currency: string;

  constructor(
    private identityService: IdentityService,
    private route: ActivatedRoute,
    private cosignerService: CosignerService,
    private contractsService: ContractsService,
    private router: Router,
    private web3Service: Web3Service,
    private spinner: NgxSpinnerService,
    private brandingService: BrandingService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.spinner.show();
    this.loadAccount();

    this.route.params.subscribe(async params => {
      const id = params.id;

      try {
        const loan = await this.contractsService.getLoan(id);
        this.loan = loan;
        this.hasHistory = true;
        this.brand = this.brandingService.getBrand(this.loan);
        this.oracle = this.loan.oracle ? this.loan.oracle.address : undefined;
        this.currency = this.loan.oracle ? this.loan.oracle.currency : 'RCN';
        this.availableOracle = this.loan.oracle.currency !== 'RCN';

        this.isRequest = this.loan.status === Status.Request;
        this.isOngoing = this.loan.status === Status.Ongoing;
        this.isExpired = this.loan.status === Status.Expired;

        this.checkLoanGenerator();
        this.loadDetail();
        this.loadIdentity();
        this.viewDetail = this.defaultDetail();

        this.spinner.hide();
      } catch (e) {
        console.error(e);
        console.info('Loan', this.loan, 'not found');
        this.router.navigate(['/404/'], { skipLocationChange: true });
      }
    });
  }

  openDetail(view: string) {
    this.viewDetail = view;
  }

  isDetail(view: string): Boolean {
    return view === this.viewDetail;
  }

  checkLoanGenerator() {
    this.generatedByUser = this.cosignerService.getCosigner(this.loan) === undefined;
  }

  /**
   * Open choose currency dialog
   */
  openLendDialog() {
    const dialogConfig = {
      data: { loan: this.loan }
    };
    this.dialog.open(DialogSelectCurrencyComponent, dialogConfig);
  }

  /**
   * Load user account
   */
  private async loadAccount() {
    const account = await this.web3Service.getAccount();
    this.userAccount = account;
    this.loadUserActions();
  }

  /**
   * Load borrower identity
   */
  private async loadIdentity() {
    const identity = await this.identityService.getIdentity(this.loan);
    this.identityName = identity ? identity.short : 'Unknown';
  }

  private defaultDetail(): string {
    if (this.generatedByUser) {
      return 'collateral';
    }

    return 'cosigner';
  }

  private loadDetail() {
    if (this.loan.status === Status.Request) {
      // Load config data
      const interest = this.loan.descriptor.interestRate.toFixed(2);
      const interestPunnitory = this.loan.descriptor.punitiveInterestRateRate.toFixed(2);
      const currency = this.loan.currency;
      const duration: string = Utils.formatDelta(this.loan.descriptor.duration);

      this.loanConfigData = [
        ['Currency', currency],
        ['Interest / Punitory', '~ ' + interest + ' % / ~ ' + interestPunnitory + ' %'],
        ['Duration', duration]
      ];

      // Template data
      this.interest = `~ ${ interest }%`;
      this.punitory = `~ ${ interestPunnitory }%`;
      this.duration = duration;

      this.expectedReturn = this.loan.currency.fromUnit(this.loan.descriptor.totalObligation).toFixed(2);
    } else {
      const currency = this.loan.currency;
      const lendDate: string = this.formatTimestamp(this.loan.debt.model.dueTime - this.loan.descriptor.duration);
      const dueDate: string = this.formatTimestamp(this.loan.debt.model.dueTime);
      const deadline: string = this.formatTimestamp(this.loan.debt.model.dueTime);
      const remaning: string = Utils.formatDelta(this.loan.debt.model.dueTime - (new Date().getTime() / 1000), 2);
      const interest: string = this.formatInterest(
        this.loan.status === Status.Indebt ? this.loan.descriptor.punitiveInterestRateRate : this.loan.descriptor.interestRate
      );

      // Show ongoing loan detail
      this.loanStatusData = [
        ['Lend date', lendDate], // TODO
        ['Due date', dueDate],
        ['Deadline', deadline],
        ['Remaining', remaning]
      ];

      // Template data
      this.interest = '~ ' + interest + ' %';
      this.lendDate = dueDate;
      this.dueDate = dueDate;

      // Load status data
      const basaltPaid = this.loan.network === Network.Basalt ? currency.fromUnit(this.loan.debt.model.paid) : 0;
      this.totalDebt = Utils.formatAmount(currency.fromUnit(this.loan.descriptor.totalObligation));
      this.pendingAmount = Utils.formatAmount(currency.fromUnit(this.loan.debt.model.estimatedObligation) - basaltPaid);
      this.paid = Utils.formatAmount(currency.fromUnit(this.loan.debt.model.paid));
    }

    this.isDiaspore = this.loan.network === Network.Diaspore;

    if (this.isDiaspore) {
      this.loadInstallments();
    } else {
      const currency = this.loan.currency;
      // Show ongoing loan detail
      this.loanStatusData = [
        ['Lend date', this.formatTimestamp(this.loan.debt.model.dueTime - this.loan.descriptor.duration)], // TODO
        ['Due date', this.formatTimestamp(this.loan.debt.model.dueTime)],
        ['Deadline', this.formatTimestamp(this.loan.debt.model.dueTime)],
        ['Remaining', Utils.formatDelta(this.loan.debt.model.dueTime - (new Date().getTime() / 1000), 2)]
      ];

      // Interest middle text
      this.interestMiddleText = '~ ' + this.formatInterest(this.loan.status === Status.Indebt ?
        this.loan.descriptor.punitiveInterestRateRate : this.loan.descriptor.interestRate) + ' %';

      // Load status data

      const basaltPaid = this.loan.network === Network.Basalt ? currency.fromUnit(this.loan.debt.model.paid) : 0;

      this.totalDebt = Utils.formatAmount(currency.fromUnit(this.loan.descriptor.totalObligation));
      this.pendingAmount = Utils.formatAmount(currency.fromUnit(this.loan.debt.model.estimatedObligation) - basaltPaid);

      this.paid = Utils.formatAmount(currency.fromUnit(this.loan.debt.model.paid));

    }

    this.isDiaspore = this.loan.network === Network.Diaspore;

    if (this.loan.network === Network.Diaspore) {
      this.diasporeData = [
        ['Installments', 'Duration', 'Cuota'],
        [
          this.loan.descriptor.installments,
          Utils.formatDelta(this.loan.descriptor.duration / this.loan.descriptor.installments),
          this.loan.currency.fromUnit(this.loan.descriptor.firstObligation) + ' ' + this.loan.currency.symbol
        ]
      ];
    }
    this.loadUserActions();
  }

  private loadUserActions() {
    if (!this.loan) {
      return;
    }

    switch (this.loan.status) {
      case Status.Request: {
        this.loanStatusRequest();
        break;
      }
      case Status.Ongoing: {
        this.loanOnGoingorIndebt();
        break;
      }
      case Status.Paid: {
        this.invalidActions();
        break;
      }
      case Status.Expired: {
        this.invalidActions();
        break;
      }
      case Status.Destroyed: {
        this.invalidActions();
        break;
      }
      case Status.Indebt: {
        this.loanOnGoingorIndebt();
        break;
      }
      default: {
        break;
      }
    }
  }

  /**
   * Load next installment data
   */
  private loadInstallments() {
    const installments: number = this.loan.descriptor.installments;
    const installmentDuration: string = Utils.formatDelta(this.loan.descriptor.duration / this.loan.descriptor.installments);
    const installmentAmount: number = this.loan.currency.fromUnit(this.loan.descriptor.firstObligation);
    const installmentCurrency: string = this.loan.currency.symbol;
    const nextInstallment: number = this.isRequest ? 1 : 1; // TODO - Next installment
    const addSuffix = (n) => ['st', 'nd', 'rd'][((n + 90) % 100 - 10) % 10 - 1] || 'th';

    this.diasporeData = [
      ['Installments', 'Duration', 'Cuota'],
      [
        installments,
        installmentDuration,
        `${ installmentAmount } ${ installmentCurrency }`
      ]
    ];

    this.nextInstallment = {
      installment: `${ nextInstallment + addSuffix(nextInstallment) } Pay`,
      amount: `${ Utils.formatAmount(installmentAmount) } ${ installmentCurrency }`,
      dueDate: installmentDuration,
      dueTime: null
    };
  }

  private invalidActions() {
    this.canLend = false;
    this.canPay = false;
    this.canTransfer = false;
    this.canCancel = false;
  }

  private loanOnGoingorIndebt() {
    if (this.loan.debt !== undefined && this.userAccount) {
      const isDebtOwner = this.userAccount.toUpperCase() === this.loan.debt.owner.toUpperCase();
      this.canTransfer = isDebtOwner;
      this.canCancel = false;
      this.canPay = !isDebtOwner;
      this.canLend = false;
    }
  }

  private loanStatusRequest() {
    if (this.userAccount) {
      const isBorrower = this.isBorrower();
      this.canLend = !isBorrower;
      this.canPay = false;
      this.canTransfer = false;
      this.canCancel = isBorrower;
    }
  }

  /**
   * Check if the loan borrower is the current account
   * @return Boolean if is borrower
   */
  private isBorrower() {
    if (this.userAccount) {
      return this.loan.borrower.toUpperCase() === this.userAccount.toUpperCase();
    }
  }

  private formatInterest(interest: number): string {
    return Number(interest.toFixed(2)).toString();
  }

  private formatTimestamp(timestamp: number): string {
    return new DatePipe('en-US').transform(timestamp * 1000, 'dd.MM.yyyy');
  }
}
