'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Reservation, Staff, Department, ReservationFormData } from '@/app/types/clinic'
import Header from '@/app/components/Header'
import StatusBadge from '@/app/components/StatusBadge'
import ReservationModal from '@/app/components/ReservationModal'

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 20}%` }} />
        </td>
      ))}
    </tr>
  )
}

export default function HomePage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [departmentList, setDepartmentList] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Reservation | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => { setIsMounted(true) }, [])

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterDate) params.set('date', filterDate)
    if (filterKeyword) params.set('keyword', filterKeyword)
    const res = await fetch(`/api/reservations?${params}`)
    const data = await res.json()
    setReservations(data)
    setLoading(false)
  }, [filterStatus, filterDate, filterKeyword])

  useEffect(() => {
    fetch('/api/staff').then((r) => r.json()).then(setStaffList)
    fetch('/api/departments').then((r) => r.json()).then(setDepartmentList)
  }, [])

  useEffect(() => {
    if (isMounted) fetchReservations()
  }, [isMounted, fetchReservations])

  const handleSave = async (data: ReservationFormData) => {
    const url = editTarget ? `/api/reservations/${editTarget.id}` : '/api/reservations'
    const method = editTarget ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Save failed')
    await fetchReservations()
    toast.success(editTarget ? '予約を更新しました' : '予約を登録しました')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」の予約を削除しますか？`)) return
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
    await fetchReservations()
    toast.success('予約を削除しました')
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      const target = reservations.find((r) => r.id === id)
      if (!target) return
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: target.patientName,
          phone: target.phone ?? '',
          status: newStatus,
          reservedAt: target.reservedAt,
          memo: target.memo ?? '',
          staffId: target.staffId ?? null,
          departmentId: target.departmentId ?? null,
        }),
      })
      if (!res.ok) throw new Error()
      await fetchReservations()
      toast.success('ステータスを変更しました')
    } catch {
      toast.error('ステータスの変更に失敗しました')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCsvExport = () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterDate) params.set('date', filterDate)
    if (filterKeyword) params.set('keyword', filterKeyword)
    window.location.href = `/api/reservations/export?${params}`
  }

  const openCreate = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (r: Reservation) => { setEditTarget(r); setModalOpen(true) }

  const todayCount = reservations.filter(
    (r) => r.reservedAt.startsWith(new Date().toISOString().slice(0, 10))
  ).length
  const reservedCount = reservations.filter((r) => r.status === 'reserved').length
  const visitedCount = reservations.filter((r) => r.status === 'visited').length
  const cancelledCount = reservations.filter((r) => r.status === 'cancelled').length

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* 統計カード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: '今日の予約', value: todayCount, color: 'blue', icon: '📅' },
            { label: '予約済', value: reservedCount, color: 'yellow', icon: '🕐' },
            { label: '来院済', value: visitedCount, color: 'green', icon: '✅' },
            { label: 'キャンセル', value: cancelledCount, color: 'gray', icon: '❌' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-3xl font-bold mt-0.5 text-${color}-600`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ステータス</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                <option value="reserved">予約済</option>
                <option value="visited">来院済</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">日付</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">患者名</label>
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="キーワード検索"
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => { setFilterStatus(''); setFilterDate(''); setFilterKeyword('') }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg"
            >
              リセット
            </button>
            <div className="ml-auto flex items-center gap-2">
              {/* CSVエクスポート */}
              <button
                onClick={handleCsvExport}
                className="hidden sm:flex items-center gap-1.5 text-sm text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                📥 CSV
              </button>
              {/* カレンダー */}
              <Link
                href="/calendar"
                className="hidden sm:flex items-center gap-1.5 text-sm text-gray-700 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                カレンダー
              </Link>
              {/* 新規予約 */}
              <button
                onClick={openCreate}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                ＋ 新規予約
              </button>
            </div>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['予約日時', '患者名', '電話番号', '診療科', '担当', 'ステータス', '操作'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-400 font-medium">予約データがありません</p>
              <p className="text-gray-300 text-sm mt-1">「＋ 新規予約」から予約を追加してください</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['予約日時', '患者名', '電話番号', '診療科', '担当', 'ステータス', '操作'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-xs">
                        {r.reservedAt.replace('T', ' ').slice(0, 16)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.patientName}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.department?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.staff?.name ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          disabled={updatingId === r.id}
                          className={`text-xs border rounded-full px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 transition-opacity ${
                            updatingId === r.id ? 'opacity-50 cursor-not-allowed' : ''
                          } ${
                            r.status === 'reserved' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            r.status === 'visited'  ? 'bg-green-50 text-green-700 border-green-200' :
                                                      'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          <option value="reserved">予約済</option>
                          <option value="visited">来院済</option>
                          <option value="cancelled">キャンセル</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(r)}
                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.patientName)}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <ReservationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editTarget}
        staffList={staffList}
        departmentList={departmentList}
      />
    </div>
  )
}