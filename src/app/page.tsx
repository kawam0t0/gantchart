"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useProjectStore } from "@/lib/project-store"
import { ProjectList } from "@/components/project-list"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export default function HomePage() {
  const { projects, addProject, fetchProjects } = useProjectStore()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    fetchProjects() // Supabaseからプロジェクトをフェッチ
  }, [fetchProjects])

  const handleAddProject = async () => {
    const newProjectId = await addProject(`新規プロジェクト ${projects.length + 1}`)
    if (newProjectId) {
      router.push(`/projects/${newProjectId}`)
    }
  }

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-slate-600">プロジェクトを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-8 text-center">洗車場開発工程表</h1>
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleAddProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-300 flex items-center space-x-2"
          >
            <PlusCircle className="h-5 w-5" />
            <span>新規プロジェクト作成</span>
          </Button>
        </div>
        <ProjectList />
      </div>
    </div>
  )
}
