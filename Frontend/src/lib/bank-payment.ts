export const BANK_TRANSFER_ACCOUNT = {
  bankName: 'Khan Bank',
  accountNumber: '5163900351',
  accountName: 'Erdenesuukh Yesudei',
} as const;

export type PaymentStatus = 'pending' | 'paid' | 'completed' | 'rejected' | 'refunded';

export function buildBankTransferReference(courseId: string, userId: string): string {
  const cleanCourse = courseId.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase();
  const cleanUser = userId.replace(/[^a-zA-Z0-9]+/g, '').slice(-6).toUpperCase();
  return `MELODEX-${cleanCourse}-${cleanUser}`;
}

export function paymentStatusAllowsCourseAccess(status: string | null | undefined): boolean {
  return status === 'paid' || status === 'completed';
}
