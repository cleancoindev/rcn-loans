import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxSpinnerService } from 'ngx-spinner';

// App Services
import { ContractsService } from './../../services/contracts.service';
import { DecentralandCosignerProvider } from './../../providers/cosigners/decentraland-cosigner-provider';
// App Modules
import { SharedModule } from '../../shared/shared.module';
import { MaterialModule } from './../../material/material.module';
// App Component
import { RequestedLoanComponent } from './requested-loan.component';

@NgModule({
  imports: [
    CommonModule,
    NgxSpinnerModule,
    MaterialModule,
    SharedModule
  ],
  declarations: [
    RequestedLoanComponent
  ],
  providers: [
    ContractsService,
    NgxSpinnerService,
    DecentralandCosignerProvider,
    {provide: String, useValue: ""}
  ],
  exports: [
    RequestedLoanComponent
  ]
})
export class RequestedLoanModule { }
