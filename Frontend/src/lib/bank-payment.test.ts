import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  BANK_TRANSFER_ACCOUNT,
  buildBankTransferReference,
  paymentStatusAllowsCourseAccess,
} from './bank-payment';

describe('bank payment helpers', () => {
  test('uses the configured Khan Bank account details', () => {
    assert.equal(BANK_TRANSFER_ACCOUNT.bankName, 'Khan Bank');
    assert.equal(BANK_TRANSFER_ACCOUNT.accountNumber, '5163900351');
    assert.equal(BANK_TRANSFER_ACCOUNT.accountName, 'Erdenesuukh Yesudei');
  });

  test('builds a stable transfer reference from course and user ids', () => {
    assert.equal(buildBankTransferReference('course-101', 'user-abcdef'), 'MELODEX-COURSE-101-ABCDEF');
  });

  test('only paid and completed payment statuses unlock courses', () => {
    assert.equal(paymentStatusAllowsCourseAccess('pending'), false);
    assert.equal(paymentStatusAllowsCourseAccess('rejected'), false);
    assert.equal(paymentStatusAllowsCourseAccess('refunded'), false);
    assert.equal(paymentStatusAllowsCourseAccess('paid'), true);
    assert.equal(paymentStatusAllowsCourseAccess('completed'), true);
  });
});
