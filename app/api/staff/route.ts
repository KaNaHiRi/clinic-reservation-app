import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = await prisma.staff.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true, isActive: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(staff)
}