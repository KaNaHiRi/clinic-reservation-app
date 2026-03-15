'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Header from '@/app/components/Header'

interface StaffItem {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffItem | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('staff')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})

  useEffect(() => { setIsMounted(true) }, [])

  const fetchStaff = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/staff')
    const data = await res.json()
    setStaffList(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isMounted) fetchStaff()
  }, [isMounted])

  const openCreate = () => {
    setEditTarget(null)
    setName(''); setEmail(''); setPassword(''); setRole('staff'); setErrors({})
    setModalOpen(true)
  }

  const openEdit = (s: StaffItem) => {
    setEditTarget(s)
    setName(s.name); setEmail(s.email); setPassword(''); setRole(s.role); setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e: { name?: string; email?: string; password?: string } = {}
    if (!name.trim()) e.name = '名前は必須です'
    if (!email.trim()) e.email = 'メールアドレスは必須です'
    if (!editTarget && !password.trim()) e.password = 'パスワードは必須です'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const url = editTarget ? `/api/admin/staff/${editTarget.id}` : '/api/admin/staff'
      const method = editTarget ? 'PUT' : 'POST'
      const body: Record<string, string> = { name, email, role }
      if (password) body.password = password
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      await fetchStaff()
      setModalOpen(false)
      toast.success(editTarget ? 'スタッフ情報を更新しました' : 'スタッフを追加しました')
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (s: StaffItem) => {
    try {
      await fetch(`/api/admin/staff/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: s.name, email: s.email, role: s.role, isActive: !s.isActive }),
      })
      await fetchStaff()
      toast.success(s.isActive ? '無効にしました' : '有効にしました')
    } catch {
      toast.error('更新に失敗しました')
    }
  }

  const handleDelete = async (s: StaffItem) => {
    if (!confirm(`「${s.name}」を削除しますか？`)) return
    try {
      await fetch(`/api/admin/staff/${s.id}`, { method: 'DELETE' })
      await fetchStaff()
      toast.success('スタッフを削除しました')
    } catch {
      toast.error('削除に失敗しました')
    }
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">スタッフ管理</h1>
            <p className="text-sm text-gray-500 mt-0.5">スタッフアカウントの追加・編集・管理</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ＋ スタッフ追加
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400">読み込み中...</div>
          ) : staffList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-gray-400">スタッフが登録されていません</p>
            </div>
          ) : (
            <>
              {/* デスクトップ：テーブル表示 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['名前', 'メールアドレス', '権限', 'ステータス', '操作'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staffList.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-3 text-gray-600">{s.email}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {s.role === 'admin' ? '管理者' : 'スタッフ'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {s.isActive ? '有効' : '無効'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50">編集</button>
                            <button onClick={() => handleToggle(s)} className="text-gray-600 hover:text-gray-800 text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">
                              {s.isActive ? '無効化' : '有効化'}
                            </button>
                            <button onClick={() => handleDelete(s)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50">削除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* モバイル：カード表示 */}
              <div className="md:hidden divide-y divide-gray-100">
                {staffList.map((s) => (
                  <div key={s.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.email}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {s.role === 'admin' ? '管理者' : 'スタッフ'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {s.isActive ? '有効' : '無効'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(s)} className="flex-1 text-blue-600 text-xs py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50">編集</button>
                      <button onClick={() => handleToggle(s)} className="flex-1 text-gray-600 text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                        {s.isActive ? '無効化' : '有効化'}
                      </button>
                      <button onClick={() => handleDelete(s)} className="flex-1 text-red-500 text-xs py-1.5 border border-red-200 rounded-lg hover:bg-red-50">削除</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* モーダル */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">{editTarget ? 'スタッフ編集' : 'スタッフ追加'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前 <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="田中 院長" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メール <span className="text-red-500">*</span></label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="staff@clinic.com" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード {!editTarget && <span className="text-red-500">*</span>}
                  {editTarget && <span className="text-xs text-gray-400 font-normal ml-1">（変更する場合のみ）</span>}
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="••••••••" />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">権限</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="staff">スタッフ</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">キャンセル</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
                {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}