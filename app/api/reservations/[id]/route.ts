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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { staff: true, department: true },
  })

  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(reservation)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = reservationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const old = await prisma.reservation.findUnique({ where: { id } })
  const reservation = await prisma.reservation.update({
    where: { id },
    data: {
      ...parsed.data,
      staffId: parsed.data.staffId || null,
      departmentId: parsed.data.departmentId || null,
    },
    include: { staff: true, department: true },
  })

  await prisma.auditLog.create({
    data: {
      action: 'UPDATE',
      entityType: 'Reservation',
      entityId: id,
      entityName: reservation.patientName,
      oldValues: JSON.stringify(old),
      newValues: JSON.stringify(parsed.data),
      userId: session.user?.id,
      userName: session.user?.name,
    },
  })

  return NextResponse.json(reservation)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.reservation.delete({ where: { id } })
  await prisma.auditLog.create({
    data: {
      action: 'DELETE',
      entityType: 'Reservation',
      entityId: id,
      entityName: reservation.patientName,
      oldValues: JSON.stringify(reservation),
      userId: session.user?.id,
      userName: session.user?.name,
    },
  })

  return NextResponse.json({ success: true })
}