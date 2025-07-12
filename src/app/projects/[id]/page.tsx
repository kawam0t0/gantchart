"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useProjectStore } from "@/lib/project-store"
import { useTaskStore } from "@/lib/task-store"
import { ProjectHeader } from "@/components/project-header"
import { GanttChart } from "@/components/gantt-chart"
import { AutoSaveIndicator } from "@/components/auto-save-indicator"
import { Toaster } from "@/components/ui/toaster"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  const { currentProject, selectProject, fetchProjects } = useProjectStore()
  const { fetchTasks } = useTaskStore()

  useEffect(() => {
    if (projectId) {
      // Fetch projects first if not already loaded
      fetchProjects().then(() => {
        selectProject(projectId)
        fetchTasks(projectId)
      })
    }
  }, [projectId, selectProject, fetchTasks, fetchProjects])

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">プロジェクトを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProjectHeader />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <GanttChart />
      </div>

      <AutoSaveIndicator />
      <Toaster />
    </div>
  )
}
