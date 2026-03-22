import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  // 全予約取得
  const reservations = await prisma.reservation.findMany({
    include: { department: true },
  })

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

  // 月別予約数（過去6ヶ月）
  const monthlyMap: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = 0
  }
  reservations.forEach((r) => {
    const month = r.reservedAt.slice(0, 7)
    if (month in monthlyMap) monthlyMap[month]++
  })
  const monthly = Object.entries(monthlyMap).map(([month, count]) => ({
    month: month.replace('-', '/'),
    count,
  }))

  // ステータス別
  const statusMap: Record<string, number> = { reserved: 0, visited: 0, cancelled: 0 }
  reservations.forEach((r) => {
    if (r.status in statusMap) statusMap[r.status]++
  })
  const statusData = [
    { name: '予約済', value: statusMap.reserved, color: '#f59e0b' },
    { name: '来院済', value: statusMap.visited, color: '#10b981' },
    { name: 'キャンセル', value: statusMap.cancelled, color: '#6b7280' },
  ]

  // 診療科別
  const deptMap: Record<string, number> = {}
  reservations.forEach((r) => {
    const name = r.department?.name ?? '未設定'
    deptMap[name] = (deptMap[name] ?? 0) + 1
  })
  const departmentData = Object.entries(deptMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // 集計カード
  const thisMonthCount = reservations.filter((r) => r.reservedAt.startsWith(thisMonth)).length
  const lastMonthCount = reservations.filter((r) => r.reservedAt.startsWith(lastMonth)).length
  const total = reservations.length

  return NextResponse.json({
    monthly,
    statusData,
    departmentData,
    summary: { thisMonth: thisMonthCount, lastMonth: lastMonthCount, total },
  })
}