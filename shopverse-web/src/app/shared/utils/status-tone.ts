export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export function statusTone(value: string | null | undefined): StatusTone {
  const status = (value ?? '').trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_');
  if (/FAILED|FAILURE|DECLINED|CANCELLED|CANCELED|ERROR|DISABLED|OUT_OF_STOCK|ATTENTION|REJECTED/.test(status)) return 'danger';
  if (/PENDING|PROCESSING|RESERVED|OPEN|TIMED_OUT|IN_PROGRESS|PARTIAL|REVIEW/.test(status)) return 'warning';
  if (/SUCCESS|CAPTURED|COMPLETED|DELIVERED|CONFIRMED|ACTIVE|REPLAYED|RESOLVED|PAID|AVAILABLE/.test(status)) return 'success';
  return 'neutral';
}
