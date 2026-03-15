import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 既存データ削除
  await prisma.auditLog.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.department.deleteMany()

  // 診療科
  const departments = await Promise.all([
    prisma.department.create({ data: { name: '内科' } }),
    prisma.department.create({ data: { name: '外科' } }),
    prisma.department.create({ data: { name: '皮膚科' } }),
    prisma.department.create({ data: { name: '小児科' } }),
  ])

  // スタッフ（パスワードは平文→本番はbcrypt必須）
  const admin = await prisma.staff.create({
    data: {
      name: '田中 院長',
      email: 'admin@clinic.com',
      password: 'admin123',
      role: 'admin',
    },
  })
  const nurse = await prisma.staff.create({
    data: {
      name: '鈴木 看護師',
      email: 'nurse@clinic.com',
      password: 'user123',
      role: 'staff',
    },
  })
  await prisma.staff.create({
    data: {
      name: '佐藤 受付',
      email: 'reception@clinic.com',
      password: 'user123',
      role: 'staff',
    },
  })

  // 今日の日付を基準にデモ予約データ
  const today = new Date()
const fmt = (d: Date, h: number, m: number) => {
  const dd = new Date(d)
  dd.setHours(h, m, 0, 0)
  // ローカル時刻をそのまま文字列化（toISOStringはUTCになるので使わない）
  const yyyy = dd.getFullYear()
  const MM = String(dd.getMonth() + 1).padStart(2, '0')
  const DD = String(dd.getDate()).padStart(2, '0')
  const HH = String(dd.getHours()).padStart(2, '0')
  const mm = String(dd.getMinutes()).padStart(2, '0')
  return `${yyyy}-${MM}-${DD}T${HH}:${mm}`
}

  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const dayAfter = new Date(today)
  dayAfter.setDate(today.getDate() + 2)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const reservations = [
    { patientName: '山田 花子', phone: '090-1234-5678', status: 'visited',   reservedAt: fmt(yesterday, 10, 0),  staffId: admin.id, departmentId: departments[0].id },
    { patientName: '佐々木 一郎', phone: '080-2345-6789', status: 'cancelled', reservedAt: fmt(yesterday, 14, 30), staffId: nurse.id, departmentId: departments[1].id },
    { patientName: '田中 次郎', phone: '070-3456-7890', status: 'reserved',  reservedAt: fmt(today, 9, 0),      staffId: admin.id, departmentId: departments[0].id },
    { patientName: '鈴木 三郎', phone: '090-4567-8901', status: 'reserved',  reservedAt: fmt(today, 10, 30),    staffId: nurse.id, departmentId: departments[2].id },
    { patientName: '高橋 四郎', phone: null,             status: 'visited',   reservedAt: fmt(today, 11, 0),     staffId: admin.id, departmentId: departments[3].id, memo: '初診' },
    { patientName: '伊藤 五郎', phone: '080-5678-9012', status: 'reserved',  reservedAt: fmt(today, 14, 0),     staffId: nurse.id, departmentId: departments[0].id },
    { patientName: '渡辺 六子', phone: '090-6789-0123', status: 'reserved',  reservedAt: fmt(tomorrow, 9, 30),  staffId: admin.id, departmentId: departments[1].id },
    { patientName: '小林 七海', phone: '070-7890-1234', status: 'reserved',  reservedAt: fmt(tomorrow, 10, 0),  staffId: nurse.id, departmentId: departments[0].id },
    { patientName: '加藤 八郎', phone: '080-8901-2345', status: 'reserved',  reservedAt: fmt(dayAfter, 13, 0),  staffId: admin.id, departmentId: departments[2].id },
    { patientName: '松本 九子', phone: null,             status: 'reserved',  reservedAt: fmt(dayAfter, 15, 30), staffId: nurse.id, departmentId: departments[3].id, memo: '定期検診' },
  ]

  for (const r of reservations) {
    await prisma.reservation.create({ data: r })
  }

  console.log('✅ Seed完了')
  console.log(`   診療科: ${departments.length}件`)
  console.log(`   スタッフ: 3件`)
  console.log(`   予約: ${reservations.length}件`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())