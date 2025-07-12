# 洗車場開発工程表 | SPLASH'N'GO!

効率的な洗車場開発のためのガントチャート管理ツール

## 🚀 機能

- 📊 **ガントチャート表示**: 視覚的なプロジェクト管理
- 📅 **OPEN日設定**: 自動スケジュール調整
- 💾 **自動保存**: データの自動保存機能
- 📝 **サブタスク管理**: 各タスクに詳細なサブタスクを追加・管理
- 👁️ **タスク非表示**: 特定のタスクをガントチャートから一時的に非表示に設定
- 📱 **レスポンシブ対応**: モバイル・タブレット対応

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UI コンポーネント**: Radix UI + shadcn/ui
- **状態管理**: Zustand
- **日付処理**: date-fns
- **アイコン**: Lucide React

## 🚀 デプロイ

このアプリケーションはVercelでホストされています。

### 開発環境での実行

\`\`\`bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
\`\`\`

### 本番ビルド

\`\`\`bash
# 本番用ビルド
npm run build

# 本番サーバーの起動
npm run start
\`\`\`

## 📄 ライセンス

© 2025 SPLASH'N'GO! All rights reserved.
\`\`\`

```text file=".gitignore"
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js build output
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo

# editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.bak
