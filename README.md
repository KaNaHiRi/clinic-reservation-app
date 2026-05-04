# クリニック予約管理システム

個人クリニック向けの予約管理Webアプリケーションです。スタッフと患者それぞれに適した機能を提供し、予約業務の効率化を実現します。

## デモ

**URL：** https://clinic-reservation-app.vercel.app

| ロール | メールアドレス | パスワード |
|--------|--------------|----------|
| 管理者 | admin@clinic.com | admin123 |
| スタッフ | staff@clinic.com | staff123 |

> ※デモ用のアカウントです。個人情報は入力しないでください。

## 主な機能

### 予約管理
- 予約の作成・編集・削除（CRUD）
- カレンダー表示による予約状況の可視化
- 予約確認メール自動送信（Resend）

### ユーザー管理
- ロールベースアクセス制御（RBAC）
- 管理者・スタッフ・患者の3ロール対応
- NextAuth.jsによる認証

### 管理機能
- 監査ログ（操作履歴の記録・追跡）
- 統計ダッシュボード（予約数・キャンセル率等）
- スタッフ・患者のユーザー管理

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|------|----------|------|
| Next.js | 15 | フレームワーク（App Router） |
| TypeScript | 5 | 型安全な開発 |
| React | 19 | UIライブラリ |
| Tailwind CSS | 3 | スタイリング |

### バックエンド
| 技術 | バージョン | 用途 |
|------|----------|------|
| Next.js API Routes | 15 | サーバーサイド処理 |
| Prisma | 6 | ORM |
| PostgreSQL | - | データベース |
| NextAuth.js | 4 | 認証・セッション管理 |

### インフラ・その他
| 技術 | 用途 |
|------|------|
| Vercel | ホスティング・デプロイ |
| Resend | メール送信 |

## システム設計

### ER図

```
User (ユーザー)
├── id
├── name
├── email
├── role (ADMIN / STAFF / PATIENT)
└── createdAt

Reservation (予約)
├── id
├── userId (→ User)
├── date
├── status (PENDING / CONFIRMED / CANCELLED)
├── notes
└── createdAt

AuditLog (監査ログ)
├── id
├── userId (→ User)
├── action
├── targetId
├── detail
└── createdAt
```

### ディレクトリ構成

```
clinic-reservation-app/
├── app/
│   ├── api/          # API Routes
│   ├── admin/        # 管理者画面
│   ├── staff/        # スタッフ画面
│   └── patient/      # 患者画面
├── lib/
│   ├── auth.ts       # 認証設定
│   ├── prisma.ts     # DBクライアント
│   └── mail.ts       # メール送信
├── prisma/
│   └── schema.prisma # DBスキーマ
└── middleware.ts      # ルート保護
```

## セキュリティ対応

- **認証**：NextAuth.jsによるセッション管理
- **認可**：ロールベースアクセス制御（RBAC）でページ・APIを保護
- **監査ログ**：全操作の記録・追跡（医療系システムの要件を意識）
- **入力値検証**：サーバーサイドでのバリデーション

## ローカル環境での起動方法

### 前提条件
- Node.js 18以上
- PostgreSQL

### 手順

```bash
# リポジトリのクローン
git clone https://github.com/KaNaHiRi/clinic-reservation-app.git
cd clinic-reservation-app

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envを編集してDATABASE_URL等を設定

# DBマイグレーション
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 開発背景

本業で医療・健診システムの開発・保守を15年担当してきた経験を活かし、実際のクリニック業務を想定して開発しました。予約管理だけでなく、医療系システムに求められる監査ログやアクセス制御まで実装しています。

## 作者

**KaNaHiRi** - システムエンジニア（医療系システム専門）

ポートフォリオ：https://portfolio-kahahiris-projects.vercel.app
