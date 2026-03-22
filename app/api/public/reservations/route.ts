// app/api/public/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { patientName, phone, reservedAt, departmentId, memo, email } = body

    if (!patientName || !reservedAt) {
      return NextResponse.json({ error: '患者名と予約日時は必須です' }, { status: 400 })
    }

    // 予約作成
    const reservation = await prisma.reservation.create({
      data: {
        patientName,
        phone: phone || null,
        reservedAt,
        departmentId: departmentId || null,
        memo: memo || null,
        status: 'reserved',
      },
      include: { department: true },
    })

    // メール送信（emailが入力されている場合のみ）
    if (email && email.trim() !== '') {
      const dateStr = new Date(reservedAt).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })

      try {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email.trim(),
          subject: '【予約確認】ご予約を承りました',
          html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #2563eb; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">🏥 予約確認メール</h1>
  </div>
  <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 16px;">${patientName} 様</p>
    <p style="margin: 0 0 20px;">以下の内容でご予約を承りました。</p>
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px; font-weight: bold; color: #64748b; width: 35%;">予約日時</td>
        <td style="padding: 12px 16px; color: #1e293b;">${dateStr}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px; font-weight: bold; color: #64748b;">診療科</td>
        <td style="padding: 12px 16px; color: #1e293b;">${reservation.department?.name ?? '未設定'}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 16px; font-weight: bold; color: #64748b;">お名前</td>
        <td style="padding: 12px 16px; color: #1e293b;">${patientName} 様</td>
      </tr>
      ${phone ? `
      <tr>
        <td style="padding: 12px 16px; font-weight: bold; color: #64748b;">電話番号</td>
        <td style="padding: 12px 16px; color: #1e293b;">${phone}</td>
      </tr>
      ` : ''}
    </table>
    <div style="margin-top: 20px; padding: 12px 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        ご予約の変更・キャンセルはお電話にてご連絡ください。
      </p>
    </div>
    <p style="margin: 20px 0 0; font-size: 12px; color: #94a3b8; text-align: center;">
      このメールは自動送信です。返信はできません。
    </p>
  </div>
</body>
</html>
          `,
        })
      } catch (mailError) {
        // メール送信失敗しても予約自体は成功扱い
        console.error('メール送信エラー:', mailError)
      }
    }

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('予約作成エラー:', error)
    return NextResponse.json({ error: '予約の作成に失敗しました' }, { status: 500 })
  }
}