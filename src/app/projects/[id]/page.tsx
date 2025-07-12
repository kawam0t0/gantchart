"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { GanttChart } from "@/components/gantt-chart"
import { SettingsPanel } from "@/components/settings-panel"
import { ProjectHeader } from "@/components/project-header"
import { useProjectStore } from "@/lib/project-store"
import { useTaskStore } from "@/lib/task-store"

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { projects, selectProject, currentProject } = useProjectStore()
  const { projectTasks } = useTaskStore()

  // プロジェクトIDが変更されたら、そのプロジェクトを選択
  useEffect(() => {
    const projectExists = projects.some((p) => p.id === projectId)

    if (!projectExists) {
      // プロジェクトが存在しない場合はホームに戻る
      router.push("/")
      return
    }

    selectProject(projectId)
  }, [projectId, projects, selectProject, router])

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-slate-600">プロジェクトを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full px-4 py-8 space-y-6">
        <ProjectHeader />
        <div className="grid gap-6">
          <SettingsPanel />
          <GanttChart />
        </div>
      </div>
    </div>
  )
}
