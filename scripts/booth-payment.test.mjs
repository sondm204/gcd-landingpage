import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePayment, transferMemo } from '../lib/booths/payment.ts';
test('commercial fee, percent and fixed discounts are calculated on the server', () => {
  const rules = JSON.stringify([{ code: 'TEN', type: 'percent', value: 10 }, { code: 'FIXED', type: 'amount', value: 6000000 }]);
  assert.equal(calculatePayment(1, '', rules).amount, 5000000);
  assert.equal(calculatePayment(34, 'TEN', rules).amount, 4500000);
  assert.equal(calculatePayment(1, 'ten', rules).amount, 4500000);
  assert.equal(calculatePayment(1, 'FIXED', rules).amount, 0);
  assert.throws(() => calculatePayment(1, 'UNKNOWN', rules));
  assert.throws(() => calculatePayment(21, 'TEN', rules));
  assert.equal(calculatePayment(21, '', rules), null);
});
test('transfer memo identifies booth and registration without contact details', () => {
  const memo = transferMemo(1, '12345678-1234-4123-8123-123456789012');
  assert.equal(memo, 'GCD TM01 123456781234');
  assert(memo.length <= 25);
  assert(transferMemo(34, '12345678-1234-4123-8123-123456789012').startsWith('GCD TM21 '));
});
