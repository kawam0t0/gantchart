"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import { useProjectStore } from "@/lib/project-store"
import { useTaskStore } from "@/lib/task-store"
import { ProjectHeader } from "@/components/project-header"
import { GanttChart } from "@/components/gantt-chart"

export default function ProjectPage() {
  const params = useParams()
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id
  const { loadProjects, projects } = useProjectStore()
  const { loadTasks } = useTaskStore()

  useEffect(() => {
    loadProjects()
    loadTasks(projectId)
  }, [loadProjects, loadTasks, projectId])

  const currentProject = projects.find((p) => p.id === projectId)

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">プロジェクトが見つかりません。</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ProjectHeader projectId={projectId} />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <GanttChart projectId={projectId} />
        </div>
      </main>
    </div>
  )
}
