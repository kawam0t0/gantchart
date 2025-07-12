"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useProjectStore } from "@/lib/project-store"
import { useTaskStore } from "@/lib/task-store"
import { ProjectHeader } from "@/components/project-header"
import { GanttChart } from "@/components/gantt-chart"
import { AutoSaveIndicator } from "@/components/auto-save-indicator"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  const { projects, currentProject, setCurrentProject, fetchProjects } = useProjectStore()
  const { fetchTasks } = useTaskStore()

  useEffect(() => {
    // Fetch projects if not already loaded
    if (projects.length === 0) {
      fetchProjects()
    }
  }, [projects.length, fetchProjects])

  useEffect(() => {
    // Set current project when projectId changes
    if (projectId && projects.length > 0) {
      setCurrentProject(projectId)
      fetchTasks(projectId)
    }
  }, [projectId, projects, setCurrentProject, fetchTasks])

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">プロジェクトを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1">
            <GanttChart projectId={projectId} />
          </div>
        </div>
      </div>
      <AutoSaveIndicator />
    </div>
  )
}
