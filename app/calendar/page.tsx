'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { dateFnsLocalizer, View } from 'react-big-calendar'
import type { Calendar as BigCalendarType } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import toast from 'react-hot-toast'
import Header from '@/app/components/Header'
import ReservationModal from '../components/ReservationModal'
import type { Reservation, ReservationFormData, Staff, Department } from '../types/clinic'

// react-big-calendarはSSR非対応のためdynamic importが必須
const Calendar = dynamic(
  () => import('react-big-calendar').then((mod) => mod.Calendar),
  { ssr: false }
) as typeof BigCalendarType<CalendarEvent>

const locales = { ja }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Reservation
}

const statusColors: Record<string, string> = {
  reserved: '#3b82f6',
  visited: '#10b981',
  cancelled: '#ef4444',
}

const messages = {
  allDay: '終日',
  previous: '前へ',
  next: '次へ',
  today: '今日',
  month: '月',
  week: '週',
  day: '日',
  agenda: '一覧',
  date: '日付',
  time: '時間',
  event: '予約',
  noEventsInRange: 'この期間に予約はありません',
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [departmentList, setDepartmentList] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null)
  const [presetDate, setPresetDate] = useState<string>('')

  const [currentView, setCurrentView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    setIsMounted(true)
    if (window.innerWidth < 768) {
      setCurrentView('agenda')
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReservations()
      fetch('/api/staff').then((r) => r.json()).then(setStaffList)
      fetch('/api/departments').then((r) => r.json()).then(setDepartmentList)
    }
  }, [status])

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/reservations')
      if (res.ok) {
        const data = await res.json()
        setReservations(data)
      }
    } catch (error) {
      console.error('予約取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const events = useMemo<CalendarEvent[]>(() => {
    return reservations.map((r) => {
      const startDate = new Date(r.reservedAt)
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000)
      return {
        id: r.id,
        title: `${r.patientName}${r.department ? ` (${r.department.name})` : ''}`,
        start: startDate,
        end: endDate,
        resource: r,
      }
    })
  }, [reservations])

  const eventStyleGetter = (event: CalendarEvent) => {
    const color = statusColors[event.resource.status] || '#6b7280'
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: 'white',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '1px 4px',
      },
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setEditingReservation(event.resource)
    setPresetDate('')
    setIsModalOpen(true)
  }

  const handleSelectSlot = ({ start }: { start: Date }) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T09:00`
    setPresetDate(dateStr)
    setEditingReservation(null)
    setIsModalOpen(true)
  }

  const handleSave = async (formData: ReservationFormData) => {
    try {
      if (editingReservation) {
        const res = await fetch(`/api/reservations/${editingReservation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('更新失敗')
        toast.success('予約を更新しました')
      } else {
        const res = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('登録失敗')
        toast.success('予約を登録しました')
      }
      setIsModalOpen(false)
      setEditingReservation(null)
      setPresetDate('')
      fetchReservations()
    } catch (error) {
      console.error('保存エラー:', error)
      toast.error('保存に失敗しました')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingReservation(null)
    setPresetDate('')
  }

  if (!isMounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* カレンダーヘッダー */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">カレンダー</h1>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                予約済
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span>
                来院済
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                キャンセル
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingReservation(null)
              setPresetDate('')
              setIsModalOpen(true)
            }}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            ＋ 新規予約
          </button>
        </div>
      </div>

      {/* カレンダー本体 */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500">予約データを読み込み中...</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-2 md:p-4">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor={(event) => event.start}
              endAccessor={(event) => event.end}
              style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}
              view={currentView}
              onView={(view) => setCurrentView(view)}
              date={currentDate}
              onNavigate={(date) => setCurrentDate(date)}
              messages={messages}
              culture="ja"
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              popup
              tooltipAccessor={(event) =>
                `${event.resource.patientName} | ${
                  event.resource.status === 'reserved' ? '予約済' :
                  event.resource.status === 'visited' ? '来院済' : 'キャンセル'
                }`
              }
            />
          </div>
        )}
      </div>

      <ReservationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initial={editingReservation}
        staffList={staffList}
        departmentList={departmentList}
        presetDate={presetDate}
      />
    </div>
  )
}