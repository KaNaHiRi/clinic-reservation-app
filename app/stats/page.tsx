'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import Header from '@/app/components/Header'

interface StatsData {
  monthly: { month: string; count: number }[]
  statusData: { name: string; value: number; color: string }[]
  departmentData: { name: string; count: number }[]
  summary: { thisMonth: number; lastMonth: number; total: number }
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/3" />
    </div>
  )
}

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  useEffect(() => {
    if (!isMounted) return
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [isMounted])

  if (!isMounted) return null

  const now = new Date()
  const thisMonthLabel = `${now.getMonth() + 1}月`
  const lastMonthLabel = `${now.getMonth() === 0 ? 12 : now.getMonth()}月`

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* ページタイトル */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">📊 統計ダッシュボード</h1>
            <p className="text-sm text-gray-500 mt-0.5">予約データの集計・分析</p>
          </div>
          <Link
            href="/"
            className="text-sm text-gray-600 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← 予約一覧に戻る
          </Link>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {loading ? (
            [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {[
                { label: `${thisMonthLabel}の予約数`, value: data?.summary.thisMonth ?? 0, icon: '📅', color: 'blue' },
                { label: `${lastMonthLabel}の予約数`, value: data?.summary.lastMonth ?? 0, icon: '📆', color: 'purple' },
                { label: '累計予約数', value: data?.summary.total ?? 0, icon: '📋', color: 'teal' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-3xl font-bold mt-0.5 text-${color}-600`}>{value}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* 月別予約数グラフ */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">📈 月別予約数（過去6ヶ月）</h2>
          {loading ? (
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.monthly ?? []} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: unknown) => [`${Number(v)}件`, '予約数']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 下段 2カラム */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ステータス別 円グラフ */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">🔵 ステータス別件数</h2>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data?.statusData ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(data?.statusData ?? []).map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: unknown) => [`${Number(v)}件`]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 診療科別 横棒グラフ */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">🏥 診療科別予約数</h2>
            {loading ? (
              <div className="h-48 bg-gray-100 rounded animate-pulse" />
            ) : data?.departmentData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                データがありません
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data?.departmentData ?? []}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: unknown) => [`${Number(v)}件`, '予約数']}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}