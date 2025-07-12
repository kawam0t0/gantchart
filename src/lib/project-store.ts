"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabaseClient } from "./supabase"
import { useAutoSaveStore } from "./auto-save-store"

export interface Project {
  id: string
  name: string
  description?: string
  openDate?: string // ISO string
  useWellWater: boolean
  createdAt: Date
  updatedAt: Date
}

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  fetchProjects: () => Promise<void>
  setCurrentProject: (projectId: string) => void
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  updateProjectOpenDate: (id: string, openDate: Date) => Promise<void>
  updateProjectUseWellWater: (id: string, useWellWater: boolean) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      let projectSubscription: any = null

      const subscribeToProjects = () => {
        if (projectSubscription) {
          supabaseClient.removeChannel(projectSubscription)
          projectSubscription = null
        }

        projectSubscription = supabaseClient
          .channel("public:projects")
          .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, (payload) => {
            console.log("Project change received!", payload)
            const { old, new: newRecord, event } = payload

            set((state) => {
              let updatedProjects = [...state.projects]

              if (event === "INSERT") {
                const newProject: Project = {
                  id: newRecord.id,
                  name: newRecord.name,
                  description: newRecord.description,
                  openDate: newRecord.open_date,
                  useWellWater: newRecord.use_well_water,
                  createdAt: new Date(newRecord.created_at),
                  updatedAt: new Date(newRecord.updated_at),
                }
                updatedProjects.push(newProject)
              } else if (event === "UPDATE") {
                updatedProjects = updatedProjects.map((p) =>
                  p.id === newRecord.id
                    ? {
                        ...p,
                        name: newRecord.name,
                        description: newRecord.description,
                        openDate: newRecord.open_date,
                        useWellWater: newRecord.use_well_water,
                        updatedAt: new Date(newRecord.updated_at),
                      }
                    : p,
                )
              } else if (event === "DELETE") {
                updatedProjects = updatedProjects.filter((p) => p.id !== old.id)
              }

              return { projects: updatedProjects }
            })
          })
          .subscribe()
      }

      return {
        projects: [],
        currentProject: null,

        fetchProjects: async () => {
          useAutoSaveStore.getState().setSaving()
          try {
            const { data, error } = await supabaseClient
              .from("projects")
              .select("*")
              .order("created_at", { ascending: false })

            if (error) throw error

            const fetchedProjects: Project[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              openDate: p.open_date,
              useWellWater: p.use_well_water,
              createdAt: new Date(p.created_at),
              updatedAt: new Date(p.updated_at),
            }))

            set({ projects: fetchedProjects })
            useAutoSaveStore.getState().setSaved()

            // Start subscription
            subscribeToProjects()
          } catch (error) {
            console.error("Error fetching projects:", error)
            useAutoSaveStore.getState().setError()
          }
        },

        setCurrentProject: (projectId: string) => {
          const project = get().projects.find((p) => p.id === projectId)
          set({ currentProject: project || null })
        },

        addProject: async (project) => {
          useAutoSaveStore.getState().setSaving()
          try {
            const { data, error } = await supabaseClient
              .from("projects")
              .insert({
                name: project.name,
                description: project.description,
                open_date: project.openDate,
                use_well_water: project.useWellWater,
              })
              .select()
              .single()

            if (error) throw error

            useAutoSaveStore.getState().setSaved()
          } catch (error) {
            console.error("Error adding project:", error)
            useAutoSaveStore.getState().setError()
          }
        },

        updateProject: async (id, updates) => {
          useAutoSaveStore.getState().setSaving()
          try {
            const updatePayload: { [key: string]: any } = { updated_at: new Date().toISOString() }
            if (updates.name !== undefined) updatePayload.name = updates.name
            if (updates.description !== undefined) updatePayload.description = updates.description
            if (updates.openDate !== undefined) updatePayload.open_date = updates.openDate
            if (updates.useWellWater !== undefined) updatePayload.use_well_water = updates.useWellWater

            const { error } = await supabaseClient.from("projects").update(updatePayload).eq("id", id)

            if (error) throw error

            useAutoSaveStore.getState().setSaved()
          } catch (error) {
            console.error("Error updating project:", error)
            useAutoSaveStore.getState().setError()
          }
        },

        updateProjectOpenDate: async (id, openDate) => {
          await get().updateProject(id, { openDate: openDate.toISOString() })
        },

        updateProjectUseWellWater: async (id, useWellWater) => {
          await get().updateProject(id, { useWellWater })
        },

        deleteProject: async (id) => {
          useAutoSaveStore.getState().setSaving()
          try {
            const { error } = await supabaseClient.from("projects").delete().eq("id", id)

            if (error) throw error

            useAutoSaveStore.getState().setSaved()
          } catch (error) {
            console.error("Error deleting project:", error)
            useAutoSaveStore.getState().setError()
          }
        },
      }
    },
    {
      name: "car-wash-projects",
    },
  ),
)
