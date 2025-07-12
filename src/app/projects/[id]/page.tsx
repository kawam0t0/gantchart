"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useProjectStore } from "@/lib/project-store"
import { useTaskStore } from "@/lib/task-store"
import { ProjectHeader } from "@/components/project-header"
import { GanttChart } from "@/components/gantt-chart"
import { SettingsPanel } from "@/components/settings-panel"
import { AutoSaveIndicator } from "@/components/auto-save-indicator"
import { useAutoSaveStore } from "@/lib/auto-save-store"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id

  const { projects, currentProject, selectProject, fetchProjects } = useProjectStore()
  const { fetchTasks } = useTaskStore()
  const { isSaving } = useAutoSaveStore()

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // プロジェクト一覧をフェッチし、その後選択
    fetchProjects().then(() => {
      if (projectId) {
        selectProject(projectId)
      }
    })
  }, [projectId, fetchProjects, selectProject])

  if (!isClient || !currentProject) {
    // currentProjectがまだロードされていない場合、または存在しない場合
    // プロジェクトが存在しない場合は、fetchProjectsとselectProjectのロジックでホームにリダイレクトされるはず
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">読み込み中...</p>
      </div>
    )
  }

  // currentProjectがロードされた後、IDが一致しない場合はエラー表示
  if (currentProject.id !== projectId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-100">
        <h1 className="text-2xl font-bold text-red-600 mb-4">プロジェクトが見つかりません</h1>
        <p className="text-slate-600 mb-6">指定されたIDのプロジェクトは存在しないか、削除されました。</p>
        <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          プロジェクト一覧に戻る
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <ProjectHeader /> {/* project propは不要になった */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <GanttChart /> {/* projectId propは不要になった */}
        </div>
        <SettingsPanel /> {/* projectId propは不要になった */}
      </div>
      <div className="fixed bottom-4 right-4">
        <AutoSaveIndicator isSaving={isSaving} />
      </div>
    </div>
  )
}
