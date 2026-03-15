// app/api/admin/staff/route.ts
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

async function checkAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET })
  return token?.role === 'admin'
}

// GET: スタッフ一覧
export async function GET(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const staff = await prisma.staff.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })
  return NextResponse.json(staff)
}

// POST: スタッフ追加
export async function POST(request: NextRequest) {
  if (!(await checkAdmin(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { name, email, password, role } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: '名前・メール・パスワードは必須です' }, { status: 400 })
  }

  const existing = await prisma.staff.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 400 })
  }

  const staff = await prisma.staff.create({
    data: { name, email, password, role: role || 'staff' },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })
  return NextResponse.json(staff, { status: 201 })
}