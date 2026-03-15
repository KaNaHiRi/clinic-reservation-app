'use client'

import { useState, useEffect } from 'react'
import { ReservationFormData, Reservation, Staff, Department } from '@/app/types/clinic'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ReservationFormData) => Promise<void>
  initial?: Reservation | null
  staffList: Staff[]
  departmentList: Department[]
  presetDate?: string
}

export default function ReservationModal({
  isOpen,
  onClose,
  onSave,
  initial,
  staffList,
  departmentList,
  presetDate,
}: Props) {
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)

  const [patientName, setPatientName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'reserved' | 'visited' | 'cancelled'>('reserved')
  const [reservedAt, setReservedAt] = useState('')
  const [memo, setMemo] = useState('')
  const [staffId, setStaffId] = useState<string | null>(null)
  const [departmentId, setDepartmentId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ patientName?: string; reservedAt?: string }>({})

  // アニメーション制御
  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true))
      })
    } else {
      setAnimating(false)
      const timer = setTimeout(() => setVisible(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setPatientName(initial?.patientName ?? '')
      setPhone(initial?.phone ?? '')
      setStatus((initial?.status as 'reserved' | 'visited' | 'cancelled') ?? 'reserved')
      setReservedAt(
        initial?.reservedAt
          ? initial.reservedAt.slice(0, 16)
          : presetDate
          ? `${presetDate}T09:00`
          : ''
      )
      setMemo(initial?.memo ?? '')
      setStaffId(initial?.staffId ?? null)
      setDepartmentId(initial?.departmentId ?? null)
      setErrors({})
    }
  }, [isOpen, initial, presetDate])

  const validate = () => {
    const e: { patientName?: string; reservedAt?: string } = {}
    if (!patientName.trim()) e.patientName = '患者名は必須です'
    if (!reservedAt) e.reservedAt = '予約日時は必須です'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await onSave({ patientName, phone, status, reservedAt, memo, staffId, departmentId })
      onClose()
    } catch {
      // エラーはtoastで表示済み
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        animating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transition-all duration-200 ${
          animating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {initial ? '予約を編集' : '新規予約'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* フォーム */}
        <div className="px-6 py-5 space-y-4">

          {/* 患者名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              患者名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.patientName ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="例：山田 太郎"
            />
            {errors.patientName && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.patientName}
              </p>
            )}
          </div>

          {/* 電話番号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：090-1234-5678"
            />
          </div>

          {/* 予約日時 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予約日時 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={reservedAt}
              onChange={(e) => setReservedAt(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.reservedAt ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.reservedAt && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.reservedAt}
              </p>
            )}
          </div>

          {/* ステータス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'reserved' | 'visited' | 'cancelled')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="reserved">予約済</option>
              <option value="visited">来院済</option>
              <option value="cancelled">キャンセル</option>
            </select>
          </div>

          {/* 診療科 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">診療科</label>
            <select
              value={departmentId ?? ''}
              onChange={(e) => setDepartmentId(e.target.value || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">未選択</option>
              {departmentList.filter((d) => d.isActive).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* 担当スタッフ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">担当スタッフ</label>
            <select
              value={staffId ?? ''}
              onChange={(e) => setStaffId(e.target.value || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">未選択</option>
              {staffList.filter((s) => s.isActive).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="備考があれば入力"
            />
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}