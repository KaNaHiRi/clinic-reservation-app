// app/api/admin/departments/[id]/route.ts
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

async function checkAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  return token?.role === 'admin'
}

// PUT: 診療科更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const body = await request.json()
  const { name, isActive } = body

  const department = await prisma.department.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(isActive !== undefined && { isActive }),
    },
  })
  return NextResponse.json(department)
}

// DELETE: 診療科削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  await prisma.department.delete({ where: { id } })
  return NextResponse.json({ success: true })
}