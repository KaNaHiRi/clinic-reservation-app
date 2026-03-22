import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || ''
  const date = searchParams.get('date') || ''
  const keyword = searchParams.get('keyword') || ''

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (date) where.reservedAt = { startsWith: date }
  if (keyword) where.patientName = { contains: keyword }

  const reservations = await prisma.reservation.findMany({
    where,
    include: { staff: true, department: true },
    orderBy: { reservedAt: 'asc' },
  })

  // BOM付きUTF-8（Excelで文字化けしない）
  const BOM = '\uFEFF'
  const header = ['予約日時', '患者名', '電話番号', '診療科', '担当スタッフ', 'ステータス', 'メモ']

  const statusLabel = (s: string) => {
    if (s === 'reserved') return '予約済'
    if (s === 'visited') return '来院済'
    if (s === 'cancelled') return 'キャンセル'
    return s
  }

  const escape = (val: string | null | undefined) => {
    if (!val) return ''
    // カンマ・改行・ダブルクォートを含む場合はダブルクォートで囲む
    if (val.includes(',') || val.includes('\n') || val.includes('"')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const rows = reservations.map((r) => [
    escape(r.reservedAt.replace('T', ' ').slice(0, 16)),
    escape(r.patientName),
    escape(r.phone),
    escape(r.department?.name),
    escape(r.staff?.name),
    escape(statusLabel(r.status)),
    escape(r.memo),
  ].join(','))

  const csv = BOM + [header.join(','), ...rows].join('\r\n')

  const filename = `reservations_${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}