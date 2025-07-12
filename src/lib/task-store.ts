"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useProjectStore } from "./project-store"
import { useAutoSaveStore } from "./auto-save-store"

export type SubTaskItem = {
  id: string
  name: string
  completed: boolean
}

export type SubTaskCategory = {
  id: string
  name: string
  items: SubTaskItem[]
}

export type Task = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  group: string
  color?: string
  memo?: string
  isHidden?: boolean // 非表示フラグを再導入
  subTasks?: SubTaskCategory[] // サブタスクを再導入
}

type TaskState = {
  tasks: Task[]
  projectTasks: Record<string, Task[]>
}

type TaskStore = TaskState & {
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  removeTask: (id: string) => void
  toggleTaskVisibility: (taskId: string) => void // タスク表示/非表示切り替え
  updateSubTaskItem: (taskId: string, categoryId: string, itemId: string, completed: boolean) => void // サブタスクアイテムの更新
}

// 自動保存のヘルパー関数
const autoSave =
  (fn: any) =>
  (...args: any[]) => {
    if (typeof window !== "undefined") {
      useAutoSaveStore.getState().setSaving()
    }

    try {
      const result = fn(...args)

      setTimeout(() => {
        if (typeof window !== "undefined") {
          useAutoSaveStore.getState().setSaved()
        }
      }, 500)

      return result
    } catch (error) {
      if (typeof window !== "undefined") {
        useAutoSaveStore.getState().setError()
      }
      throw error
    }
  }

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      projectTasks: {},

      setTasks: autoSave((tasks: Task[]) => {
        const currentProjectId = useProjectStore.getState().currentProjectId

        if (!currentProjectId) {
          set({ tasks: [] })
          return
        }

        set((state) => ({
          tasks,
          projectTasks: {
            ...state.projectTasks,
            [currentProjectId]: tasks,
          },
        }))
      }),

      addTask: autoSave((task: Task) => {
        const currentProjectId = useProjectStore.getState().currentProjectId

        if (!currentProjectId) return

        set((state) => {
          const newTasks = [...state.tasks, task]

          return {
            tasks: newTasks,
            projectTasks: {
              ...state.projectTasks,
              [currentProjectId]: newTasks,
            },
          }
        })
      }),

      updateTask: autoSave((updatedTask: Task) => {
        const currentProjectId = useProjectStore.getState().currentProjectId

        if (!currentProjectId) return

        set((state) => {
          const newTasks = state.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))

          return {
            tasks: newTasks,
            projectTasks: {
              ...state.projectTasks,
              [currentProjectId]: newTasks,
            },
          }
        })
      }),

      removeTask: autoSave((id: string) => {
        const currentProjectId = useProjectStore.getState().currentProjectId

        if (!currentProjectId) return

        set((state) => {
          const newTasks = state.tasks.filter((task) => task.id !== id)

          return {
            tasks: newTasks,
            projectTasks: {
              ...state.projectTasks,
              [currentProjectId]: newTasks,
            },
          }
        })
      }),

      toggleTaskVisibility: autoSave((taskId: string) => {
        const currentProjectId = useProjectStore.getState().currentProjectId
        if (!currentProjectId) return

        set((state) => {
          const newTasks = state.tasks.map((task) =>
            task.id === taskId ? { ...task, isHidden: !task.isHidden } : task,
          )
          return {
            tasks: newTasks,
            projectTasks: {
              ...state.projectTasks,
              [currentProjectId]: newTasks,
            },
          }
        })
      }),

      updateSubTaskItem: autoSave((taskId: string, categoryId: string, itemId: string, completed: boolean) => {
        const currentProjectId = useProjectStore.getState().currentProjectId
        if (!currentProjectId) return

        set((state) => {
          const newTasks = state.tasks.map((task) => {
            if (task.id === taskId && task.subTasks) {
              const updatedSubTasks = task.subTasks.map((category) => {
                if (category.id === categoryId) {
                  const updatedItems = category.items.map((item) =>
                    item.id === itemId ? { ...item, completed } : item,
                  )
                  return { ...category, items: updatedItems }
                }
                return category
              })
              return { ...task, subTasks: updatedSubTasks }
            }
            return task
          })
          return {
            tasks: newTasks,
            projectTasks: {
              ...state.projectTasks,
              [currentProjectId]: newTasks,
            },
          }
        })
      }),
    }),
    {
      name: "car-wash-tasks",
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            const currentProjectId = useProjectStore.getState().currentProjectId

            if (currentProjectId && state.projectTasks[currentProjectId]) {
              state.tasks = state.projectTasks[currentProjectId]
            } else {
              state.tasks = []
            }
          }
        }
      },
    },
  ),
)
