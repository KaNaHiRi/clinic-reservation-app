import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const reservationSchema = z.object({
  patientName: z.string().min(1, '患者名は必須です'),
  phone: z.string().optional(),
  status: z.enum(['reserved', 'visited', 'cancelled']),
  reservedAt: z.string().min(1, '予約日時は必須です'),
  memo: z.string().optional(),
  staffId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const date = searchParams.get('date')
  const keyword = searchParams.get('keyword')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (date) {
    where.reservedAt = {
      gte: `${date}T00:00`,
      lte: `${date}T23:59`,
    }
  }
  if (keyword) {
    where.patientName = { contains: keyword }
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: { staff: true, department: true },
    orderBy: { reservedAt: 'asc' },
  })

  return NextResponse.json(reservations)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = reservationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const reservation = await prisma.reservation.create({
    data: {
      ...parsed.data,
      staffId: parsed.data.staffId || null,
      departmentId: parsed.data.departmentId || null,
    },
    include: { staff: true, department: true },
  })

  await prisma.auditLog.create({
    data: {
      action: 'CREATE',
      entityType: 'Reservation',
      entityId: reservation.id,
      entityName: reservation.patientName,
      newValues: JSON.stringify(parsed.data),
      userId: session.user?.id,
      userName: session.user?.name,
    },
  })

  return NextResponse.json(reservation, { status: 201 })
}