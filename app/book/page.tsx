// app/book/page.tsx
'use client'

import { useState, useEffect } from 'react'

interface Department {
  id: string
  name: string
}

export default function BookPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [form, setForm] = useState({
    patientName: '',
    phone: '',
    email: '',
    reservedAt: '',
    departmentId: '',
    memo: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((data) => setDepartments(data.filter((d: Department & { isActive: boolean }) => d.isActive)))
      .catch(() => {})
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.patientName.trim()) { setError('お名前を入力してください'); return }
    if (!form.reservedAt) { setError('予約希望日時を選択してください'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/public/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? '予約に失敗しました')
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '予約に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">予約が完了しました</h2>
          <p className="text-gray-500 mb-2">ご予約ありがとうございます。</p>
          {form.email && (
            <p className="text-sm text-blue-600 mb-6">
              確認メールを <strong>{form.email}</strong> に送信しました
            </p>
          )}
          <button
            onClick={() => { setDone(false); setForm({ patientName: '', phone: '', email: '', reservedAt: '', departmentId: '', memo: '' }) }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            新しい予約をする
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏥</div>
          <h1 className="text-2xl font-bold text-gray-800">診療予約フォーム</h1>
          <p className="text-gray-500 text-sm mt-1">ご希望の日時をお選びください</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          {/* お名前 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="patientName"
              value={form.patientName}
              onChange={handleChange}
              placeholder="山田 太郎"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 電話番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="090-1234-5678"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* メールアドレス（新規追加） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
              <span className="text-gray-400 text-xs ml-1">（確認メールを送ります）</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 予約日時 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予約希望日時 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="reservedAt"
              value={form.reservedAt}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 診療科 */}
          {departments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">診療科</label>
              <select
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 備考 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">症状・備考</label>
            <textarea
              name="memo"
              value={form.memo}
              onChange={handleChange}
              rows={3}
              placeholder="症状やご要望をご記入ください（任意）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full mt-6 py-3 rounded-xl font-medium text-white transition-colors ${
            submitting
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitting ? '送信中...' : '予約を申し込む'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          ※ 予約確定後、スタッフよりご連絡する場合があります
        </p>
      </div>
    </div>
  )
}