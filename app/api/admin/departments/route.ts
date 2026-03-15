// app/api/admin/departments/route.ts
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

async function checkAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  return token?.role === 'admin'
}

// GET: 診療科一覧
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const departments = await prisma.department.findMany({
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(departments)
}

// POST: 診療科追加
export async function POST(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { name } = body

  if (!name) {
    return NextResponse.json({ error: '診療科名は必須です' }, { status: 400 })
  }

  const department = await prisma.department.create({
    data: { name },
  })
  return NextResponse.json(department, { status: 201 })
}