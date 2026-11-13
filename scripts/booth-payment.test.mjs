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
test('transfer memo uses organization name and the requested prefix', () => {
  assert.equal(transferMemo(1, 'Đơn vị Gốm Việt'), 'JCITL GCD TM01 DON VI GOM VIET');
  assert.equal(transferMemo(34, 'Gốm Việt'), 'JCITL GCD TM21 GOM VIET');
  assert(transferMemo(1, 'A'.repeat(120)).length <= 50);
});
