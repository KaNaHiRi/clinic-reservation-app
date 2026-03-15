import { ReservationStatus } from '@/app/types/clinic'

const config: Record<ReservationStatus, { label: string; className: string }> = {
  reserved: { label: '予約済', className: 'bg-blue-100 text-blue-700' },
  visited: { label: '来院済', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'キャンセル', className: 'bg-gray-100 text-gray-500' },
}

export default function StatusBadge({ status }: { status: ReservationStatus }) {
  const { label, className } = config[status] ?? config.reserved
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}