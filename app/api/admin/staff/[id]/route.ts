// app/api/admin/staff/[id]/route.ts
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

async function checkAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  return token?.role === 'admin'
}

// PUT: スタッフ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json()
  const { name, email, role, isActive } = body

  const staff = await prisma.staff.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(isActive !== undefined && { isActive }),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })
  return NextResponse.json(staff)
}

// DELETE: スタッフ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  await prisma.staff.delete({ where: { id } })
  return NextResponse.json({ success: true })
}