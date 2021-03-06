import { FormatAmountPipe } from './format-amount.pipe';

describe('FormatAmountPipe', () => {
  it('create an instance', () => {
    const pipe = new FormatAmountPipe();
    expect(pipe).toBeTruthy();
  });

  it('should format an invalid amount', () => {
    expect(new FormatAmountPipe().transform('example')).toEqual('0.00');
  });

  it('should format an amount in number format', () => {
    expect(new FormatAmountPipe().transform(41999.4241284)).toEqual('41,999.42');
  });

  it('should format an amount in string format', () => {
    expect(new FormatAmountPipe().transform('41999.4241284')).toEqual('41,999.42');
  });
});
