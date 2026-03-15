'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = session?.user?.role === 'admin'

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2 text-blue-600 font-bold text-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            クリニック予約
          </Link>

          {/* デスクトップメニュー */}
          <nav className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              予約一覧
            </Link>
            <Link href="/calendar" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              カレンダー
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin/staff" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  スタッフ管理
                </Link>
                <Link href="/admin/departments" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  診療科管理
                </Link>
              </>
            )}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              <span className="text-xs text-gray-500">
                {session?.user?.name ?? session?.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 border border-gray-200 rounded hover:border-red-200 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </nav>

          {/* モバイル：ハンバーガーボタン */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            {menuOpen ? (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* モバイルドロワー */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors"
            >
              📋 予約一覧
            </Link>
            <Link
              href="/calendar"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors"
            >
              📅 カレンダー
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/admin/staff"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors"
                >
                  👤 スタッフ管理
                </Link>
                <Link
                  href="/admin/departments"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-gray-700 hover:bg-gray-50 px-3 py-2.5 rounded-lg transition-colors"
                >
                  🏥 診療科管理
                </Link>
              </>
            )}
            <div className="border-t border-gray-100 mt-2 pt-2">
              <p className="text-xs text-gray-400 px-3 mb-1">
                {session?.user?.name ?? session?.user?.email}
              </p>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full text-left text-sm text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}