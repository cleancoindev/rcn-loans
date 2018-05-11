
import { Utils } from './../utils/utils';

export class Loan {
    public id: number;
    public status: number;
    public borrower: string;
    public creator: string;
    public rawAmount: number;
    public duration: number;
    public rawAnnualInterest: number;
    public rawAnnualPunitoryInterest: number;
    public currencyRaw: string;

    constructor(
      id: number,
      status: number,
      borrower: string,
      creator: string,
      rawAmount: number,
      duration: number,
      rawAnnualInterest: number,
      rawAnnualPunitoryInterest: number,
      currencyRaw: string) {
        this.id = id;
        this.status = status;
        this.borrower = Utils.formatAddress(borrower);
        this.creator = Utils.formatAddress(creator);
        this.rawAmount = rawAmount;
        this.duration = duration;
        this.rawAnnualInterest = rawAnnualInterest;
        this.rawAnnualPunitoryInterest = rawAnnualPunitoryInterest;
        this.currencyRaw = currencyRaw;
      }

    get currency(): string {
        const targetCurrency = Utils.hexToAscii(this.currencyRaw.replace(/^[0x]+|[0]+$/g,''));

        if (targetCurrency == "") {
            return 'RCN';
        } else {
            return targetCurrency;
        }
    }

    get borrowerShort(): string {
        return this.borrower.substr(0, 4) + '...' + this.borrower.substr(-4);
    }

    get decimals(): number {
        // TODO: Detect fiat currency
        return 18;
    } 

    get amount(): number {
        return this.rawAmount / 10 ** this.decimals;
    }

    get annualInterest(): number {
        return Utils.formatInterest(this.rawAnnualInterest);
    }

    get annualPunitoryInterest(): number {
        return Utils.formatInterest(this.rawAnnualPunitoryInterest);
    }

    get verboseDuration(): string {
        return Utils.formatDelta(this.duration);
    }

    get expectedReturn(): number {
        return ((this.amount * 100000 * this.duration) / this.rawAnnualInterest) + this.amount;
    }
  }