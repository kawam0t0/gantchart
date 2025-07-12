"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useTaskStore } from "./task-store"
import { useAutoSaveStore } from "./auto-save-store"

export type Project = {
  id: string
  name: string
  openDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

type ProjectStore = {
  projects: Project[]
  currentProjectId: string | null
  currentProject: Project | null
  addProject: (name: string) => string
  selectProject: (id: string) => void
  updateProjectName: (id: string, name: string) => void
  updateProjectOpenDate: (id: string, openDate: Date) => void
  deleteProject: (id: string) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      currentProject: null,

      addProject: (name: string) => {
        // 保存開始を通知
        if (typeof window !== "undefined") {
          try {
            useAutoSaveStore.getState().setSaving()
          } catch (error) {
            console.warn("Auto-save indicator error:", error)
          }
        }

        const newProject = {
          id: `project-${Date.now()}`,
          name,
          openDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set((state) => ({
          projects: [...state.projects, newProject],
          currentProjectId: newProject.id,
          currentProject: newProject,
        }))

        // 新しいプロジェクトを選択したら、タスクをクリア
        useTaskStore.getState().setTasks([])

        // 保存完了を通知
        setTimeout(() => {
          if (typeof window !== "undefined") {
            try {
              useAutoSaveStore.getState().setSaved()
            } catch (error) {
              console.warn("Auto-save indicator error:", error)
            }
          }
        }, 500)

        return newProject.id
      },

      selectProject: (id: string) => {
        const project = get().projects.find((p) => p.id === id) || null
        set({ currentProjectId: id, currentProject: project })

        // プロジェクトを切り替えたら、そのプロジェクトのタスクを読み込む
        if (id) {
          const projectTasks = useTaskStore.getState().projectTasks[id] || []
          useTaskStore.getState().setTasks(projectTasks)
        } else {
          useTaskStore.getState().setTasks([])
        }
      },

      updateProjectName: (id: string, name: string) => {
        // 保存開始を通知
        if (typeof window !== "undefined") {
          try {
            useAutoSaveStore.getState().setSaving()
          } catch (error) {
            console.warn("Auto-save indicator error:", error)
          }
        }

        const now = new Date()
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, name, updatedAt: now } : project,
          ),
          currentProject:
            state.currentProject?.id === id ? { ...state.currentProject, name, updatedAt: now } : state.currentProject,
        }))

        // 保存完了を通知
        setTimeout(() => {
          if (typeof window !== "undefined") {
            try {
              useAutoSaveStore.getState().setSaved()
            } catch (error) {
              console.warn("Auto-save indicator error:", error)
            }
          }
        }, 500)
      },

      updateProjectOpenDate: (id: string, openDate: Date) => {
        // 保存開始を通知
        if (typeof window !== "undefined") {
          try {
            useAutoSaveStore.getState().setSaving()
          } catch (error) {
            console.warn("Auto-save indicator error:", error)
          }
        }

        const now = new Date()
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, openDate, updatedAt: now } : project,
          ),
          currentProject:
            state.currentProject?.id === id
              ? { ...state.currentProject, openDate, updatedAt: now }
              : state.currentProject,
        }))

        // 保存完了を通知
        setTimeout(() => {
          if (typeof window !== "undefined") {
            try {
              useAutoSaveStore.getState().setSaved()
            } catch (error) {
              console.warn("Auto-save indicator error:", error)
            }
          }
        }, 500)
      },

      deleteProject: (id) => {
        const { projects, currentProjectId } = get()
        const filteredProjects = projects.filter((p) => p.id !== id)

        // 現在選択中のプロジェクトを削除した場合
        let newCurrentId = currentProjectId
        let newCurrentProject = null

        if (currentProjectId === id) {
          // 他のプロジェクトがあれば最初のものを選択
          if (filteredProjects.length > 0) {
            newCurrentId = filteredProjects[0].id
            newCurrentProject = filteredProjects[0]
          } else {
            newCurrentId = null
          }

          // タスクをクリア
          useTaskStore.getState().setTasks([])
        } else if (currentProjectId) {
          newCurrentProject = projects.find((p) => p.id === currentProjectId) || null
        }

        set({
          projects: filteredProjects,
          currentProjectId: newCurrentId,
          currentProject: newCurrentProject,
        })
      },
    }),
    {
      name: "car-wash-projects",
    },
  ),
)
