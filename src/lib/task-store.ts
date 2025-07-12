"use client"

import { create } from "zustand"
import { supabaseClient } from "./supabase"
import { useAutoSaveStore } from "./auto-save-store"

export type TaskStatus = "未着手" | "進行中" | "完了" | "遅延"

export interface SubTaskItem {
  id: string
  name: string
  completed: boolean
}

export interface SubTaskCategory {
  id: string
  name: string
  items: SubTaskItem[]
}

export interface Task {
  id: string
  project_id: string
  name: string
  startDate: number
  endDate: number
  duration: number
  progress: number
  status: TaskStatus
  dependencies: string[]
  category: string
  subTasks?: SubTaskCategory[]
  isHidden?: boolean
  createdAt: Date
  updatedAt: Date
}

interface TaskState {
  tasks: Task[]
  fetchTasks: (projectId: string) => Promise<void>
  setTasks: (tasks: Task[]) => void
  addTask: (
    projectId: string,
    task: Omit<Task, "id" | "duration" | "status" | "progress" | "project_id" | "createdAt" | "updatedAt"> & {
      status?: TaskStatus
      progress?: number
      duration?: number
      id?: string
    },
  ) => Promise<void>
  updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (projectId: string, taskId: string) => Promise<void>
  updateSubTaskItem: (
    projectId: string,
    taskId: string,
    categoryId: string,
    itemId: string,
    completed: boolean,
  ) => Promise<void>
  toggleTaskVisibility: (projectId: string, taskId: string, isHidden: boolean) => Promise<void>
  deleteAllTasksForProject: (projectId: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => {
  let taskSubscription: any = null
  let currentSubscribedProjectId: string | null = null

  const subscribeToTasks = (projectId: string) => {
    if (taskSubscription) {
      supabaseClient.removeChannel(taskSubscription)
      taskSubscription = null
    }

    if (!projectId) {
      set({ tasks: [] })
      return
    }

    currentSubscribedProjectId = projectId

    taskSubscription = supabaseClient
      .channel(`public:tasks:project_id=eq.${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `project_id=eq.${projectId}` },
        (payload) => {
          console.log("Task change received!", payload)
          const { old, new: newRecord, event } = payload

          if (currentSubscribedProjectId !== projectId) {
            console.log("Ignoring task change for different project ID.")
            return
          }

          set((state) => {
            let updatedTasks = [...state.tasks]

            if (event === "INSERT") {
              const newTask: Task = {
                id: newRecord.id,
                project_id: newRecord.project_id,
                name: newRecord.name,
                startDate: newRecord.start_date,
                endDate: newRecord.end_date,
                duration: newRecord.duration,
                progress: newRecord.progress,
                status: newRecord.status,
                dependencies: newRecord.dependencies || [],
                category: newRecord.category,
                subTasks: newRecord.sub_tasks || [],
                isHidden: newRecord.is_hidden,
                createdAt: new Date(newRecord.created_at),
                updatedAt: new Date(newRecord.updated_at),
              }
              updatedTasks.push(newTask)
            } else if (event === "UPDATE") {
              updatedTasks = updatedTasks.map((t) =>
                t.id === newRecord.id
                  ? {
                      ...t,
                      name: newRecord.name,
                      startDate: newRecord.start_date,
                      endDate: newRecord.end_date,
                      duration: newRecord.duration,
                      progress: newRecord.progress,
                      status: newRecord.status,
                      dependencies: newRecord.dependencies || [],
                      category: newRecord.category,
                      subTasks: newRecord.sub_tasks || [],
                      isHidden: newRecord.is_hidden,
                      updatedAt: new Date(newRecord.updated_at),
                    }
                  : t,
              )
            } else if (event === "DELETE") {
              updatedTasks = updatedTasks.filter((t) => t.id !== old.id)
            }
            return { tasks: updatedTasks }
          })
        },
      )
      .subscribe()
  }

  return {
    tasks: [],

    setTasks: (tasks: Task[]) => set({ tasks }),

    fetchTasks: async (projectId: string) => {
      if (!projectId) {
        set({ tasks: [] })
        return
      }

      useAutoSaveStore.getState().setSaving()
      try {
        const { data, error } = await supabaseClient
          .from("tasks")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true })

        if (error) throw error

        const fetchedTasks: Task[] = data.map((t: any) => ({
          id: t.id,
          project_id: t.project_id,
          name: t.name,
          startDate: t.start_date,
          endDate: t.end_date,
          duration: t.duration,
          progress: t.progress,
          status: t.status,
          dependencies: t.dependencies || [],
          category: t.category,
          subTasks: t.sub_tasks || [],
          isHidden: t.is_hidden,
          createdAt: new Date(t.created_at),
          updatedAt: new Date(t.updated_at),
        }))
        set({ tasks: fetchedTasks })
        useAutoSaveStore.getState().setSaved()

        subscribeToTasks(projectId)
      } catch (error) {
        console.error("Error fetching tasks:", error)
        useAutoSaveStore.getState().setError()
      }
    },

    addTask: async (projectId, task) => {
      useAutoSaveStore.getState().setSaving()
      try {
        const newDuration =
          task.duration ||
          (task.startDate && task.endDate ? Math.ceil((task.endDate - task.startDate) / (1000 * 60 * 60 * 24)) + 1 : 1)

        const { data, error } = await supabaseClient
          .from("tasks")
          .insert({
            project_id: projectId,
            name: task.name,
            start_date: task.startDate,
            end_date: task.endDate,
            duration: newDuration,
            progress: task.progress ?? 0,
            status: task.status ?? "未着手",
            dependencies: task.dependencies ?? [],
            category: task.category,
            sub_tasks: task.subTasks ?? [],
            is_hidden: task.isHidden ?? false,
          })
          .select()
          .single()

        if (error) throw error

        useAutoSaveStore.getState().setSaved()
      } catch (error) {
        console.error("Error adding task:", error)
        useAutoSaveStore.getState().setError()
      }
    },

    updateTask: async (projectId, taskId, updates) => {
      useAutoSaveStore.getState().setSaving()
      try {
        const updatePayload: { [key: string]: any } = { updated_at: new Date().toISOString() }
        if (updates.name !== undefined) updatePayload.name = updates.name
        if (updates.startDate !== undefined) updatePayload.start_date = updates.startDate
        if (updates.endDate !== undefined) updatePayload.end_date = updates.endDate
        if (updates.duration !== undefined) updatePayload.duration = updates.duration
        if (updates.progress !== undefined) updatePayload.progress = updates.progress
        if (updates.status !== undefined) updatePayload.status = updates.status
        if (updates.dependencies !== undefined) updatePayload.dependencies = updates.dependencies
        if (updates.category !== undefined) updatePayload.category = updates.category
        if (updates.subTasks !== undefined) updatePayload.sub_tasks = updates.subTasks
        if (updates.isHidden !== undefined) updatePayload.is_hidden = updates.isHidden

        const { error } = await supabaseClient
          .from("tasks")
          .update(updatePayload)
          .eq("id", taskId)
          .eq("project_id", projectId)

        if (error) throw error

        useAutoSaveStore.getState().setSaved()
      } catch (error) {
        console.error("Error updating task:", error)
        useAutoSaveStore.getState().setError()
      }
    },

    deleteTask: async (projectId, taskId) => {
      useAutoSaveStore.getState().setSaving()
      try {
        const { error } = await supabaseClient.from("tasks").delete().eq("id", taskId).eq("project_id", projectId)

        if (error) throw error

        useAutoSaveStore.getState().setSaved()
      } catch (error) {
        console.error("Error deleting task:", error)
        useAutoSaveStore.getState().setError()
      }
    },

    updateSubTaskItem: async (projectId, taskId, categoryId, itemId, completed) => {
      useAutoSaveStore.getState().setSaving()
      try {
        const currentTask = get().tasks.find((t) => t.id === taskId)
        if (!currentTask) throw new Error("Task not found for subtask update.")

        const updatedSubTasks = currentTask.subTasks?.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                items: category.items.map((item) => (item.id === itemId ? { ...item, completed } : item)),
              }
            : category,
        )

        const { error } = await supabaseClient
          .from("tasks")
          .update({ sub_tasks: updatedSubTasks, updated_at: new Date().toISOString() })
          .eq("id", taskId)
          .eq("project_id", projectId)

        if (error) throw error

        useAutoSaveStore.getState().setSaved()
      } catch (error) {
        console.error("Error updating subtask item:", error)
        useAutoSaveStore.getState().setError()
      }
    },

    toggleTaskVisibility: async (projectId, taskId, isHidden) => {
      useAutoSaveStore.getState().setSaving()
      try {
        const { error } = await supabaseClient
          .from("tasks")
          .update({ is_hidden: isHidden, updated_at: new Date().toISOString() })
          .eq("id", taskId)
          .eq("project_id", projectId)

        if (error) throw error

        useAutoSaveStore.getState().setSaved()
      } catch (error) {
        console.error("Error toggling task visibility:", error)
        useAutoSaveStore.getState().setError()
      }
    },

    deleteAllTasksForProject: async (projectId: string) => {
      useAutoSaveStore.getState().setSaving()
      try {
        const { error } = await supabaseClient.from("tasks").delete().eq("project_id", projectId)

        if (error) throw error

        useAutoSaveStore.getState().setSaved()
      } catch (error) {
        console.error("Error deleting all tasks for project:", error)
        useAutoSaveStore.getState().setError()
      }
    },
  }
})
