'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Header from '@/app/components/Header'

interface DeptItem {
  id: string
  name: string
  isActive: boolean
}

export default function DepartmentsPage() {
  const [deptList, setDeptList] = useState<DeptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DeptItem | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState('')

  useEffect(() => { setIsMounted(true) }, [])

  const fetchDepts = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/departments')
    const data = await res.json()
    setDeptList(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isMounted) fetchDepts()
  }, [isMounted])

  const openCreate = () => {
    setEditTarget(null); setName(''); setNameError(''); setModalOpen(true)
  }

  const openEdit = (d: DeptItem) => {
    setEditTarget(d); setName(d.name); setNameError(''); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) { setNameError('診療科名は必須です'); return }
    setSaving(true)
    try {
      const url = editTarget ? `/api/admin/departments/${editTarget.id}` : '/api/admin/departments'
      const method = editTarget ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error()
      await fetchDepts()
      setModalOpen(false)
      toast.success(editTarget ? '診療科を更新しました' : '診療科を追加しました')
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (d: DeptItem) => {
    try {
      await fetch(`/api/admin/departments/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: d.name, isActive: !d.isActive }),
      })
      await fetchDepts()
      toast.success(d.isActive ? '無効にしました' : '有効にしました')
    } catch {
      toast.error('更新に失敗しました')
    }
  }

  const handleDelete = async (d: DeptItem) => {
    if (!confirm(`「${d.name}」を削除しますか？`)) return
    try {
      await fetch(`/api/admin/departments/${d.id}`, { method: 'DELETE' })
      await fetchDepts()
      toast.success('診療科を削除しました')
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
            <h1 className="text-xl font-bold text-gray-800">診療科管理</h1>
            <p className="text-sm text-gray-500 mt-0.5">診療科の追加・編集・管理</p>
          </div>
          <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            ＋ 診療科追加
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400">読み込み中...</div>
          ) : deptList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🏥</div>
              <p className="text-gray-400">診療科が登録されていません</p>
            </div>
          ) : (
            <>
              {/* デスクトップ */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['診療科名', 'ステータス', '操作'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deptList.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {d.isActive ? '有効' : '無効'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(d)} className="text-blue-600 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50">編集</button>
                            <button onClick={() => handleToggle(d)} className="text-gray-600 text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">
                              {d.isActive ? '無効化' : '有効化'}
                            </button>
                            <button onClick={() => handleDelete(d)} className="text-red-500 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50">削除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* モバイル：カード */}
              <div className="md:hidden divide-y divide-gray-100">
                {deptList.map((d) => (
                  <div key={d.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏥</span>
                      <div>
                        <p className="font-medium text-gray-800">{d.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {d.isActive ? '有効' : '無効'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)} className="text-blue-600 text-xs px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50">編集</button>
                      <button onClick={() => handleToggle(d)} className="text-gray-600 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                        {d.isActive ? '無効' : '有効'}
                      </button>
                      <button onClick={() => handleDelete(d)} className="text-red-500 text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50">削除</button>
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
              <h2 className="text-lg font-semibold text-gray-800">{editTarget ? '診療科編集' : '診療科追加'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">診療科名 <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${nameError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                placeholder="例：内科" />
              {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
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