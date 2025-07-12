import { ProjectList } from "@/components/project-list"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 transition-all duration-500">
      <div className="w-full px-4 py-8 space-y-6">
        <div className="bg-blue-600 p-6 rounded-lg shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-blue-500 opacity-20 animate-pulse"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight text-white">洗車場開発工程表</h1>
            <p className="text-blue-100 mt-2">効率的な洗車場開発のためのガントチャート管理ツール</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">プロジェクト一覧</h2>
          <p className="text-slate-600 mb-6">既存のプロジェクトを選択するか、新しいプロジェクトを作成してください。</p>
          <ProjectList />
        </div>
      </div>
    </div>
  )
}
