"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabaseClient } from "./supabase"
import { useAutoSaveStore } from "./auto-save-store"

export type Project = {
  id: string
  name: string
  openDate?: Date | null
  useWellWater: boolean
  createdAt: Date
  updatedAt: Date
}

type ProjectStore = {
  projects: Project[]
  currentProjectId: string | null
  currentProject: Project | null
  fetchProjects: () => Promise<void>
  addProject: (name: string) => Promise<string | undefined>
  selectProject: (id: string) => void
  updateProjectName: (id: string, name: string) => Promise<void>
  updateProjectOpenDate: (id: string, openDate: Date) => Promise<void>
  updateProjectUseWellWater: (id: string, useWellWater: boolean) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => {
      let projectSubscription: any = null

      const subscribeToProjects = () => {
        if (projectSubscription) {
          supabaseClient.removeChannel(projectSubscription)
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
                  openDate: newRecord.open_date ? new Date(newRecord.open_date) : null,
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
                        openDate: newRecord.open_date ? new Date(newRecord.open_date) : null,
                        useWellWater: newRecord.use_well_water,
                        updatedAt: new Date(newRecord.updated_at),
                      }
                    : p,
                )
              } else if (event === "DELETE") {
                updatedProjects = updatedProjects.filter((p) => p.id !== old.id)
                if (state.currentProjectId === old.id) {
                  set({ currentProjectId: null, currentProject: null })
                }
              }
              return { projects: updatedProjects }
            })
          })
          .subscribe()
      }

      return {
        projects: [],
        currentProjectId: null,
        currentProject: null,

        fetchProjects: async () => {
          try {
            const { data, error } = await supabaseClient
              .from("projects")
              .select("*")
              .order("created_at", { ascending: false })

            if (error) throw error

            const fetchedProjects: Project[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              openDate: p.open_date ? new Date(p.open_date) : null,
              useWellWater: p.use_well_water,
              createdAt: new Date(p.created_at),
              updatedAt: new Date(p.updated_at),
            }))

            set({ projects: fetchedProjects })
            subscribeToProjects()
          } catch (error) {
            console.error("Error fetching projects:", error)
            useAutoSaveStore.getState().setError()
          }
        },

        addProject: async (name: string) => {
          useAutoSaveStore.getState().setSaving()
          try {
            const { data, error } = await supabaseClient
              .from("projects")
              .insert({ name, use_well_water: false })
              .select()
              .single()

            if (error) throw error

            const newProject: Project = {
              id: data.id,
              name: data.name,
              openDate: data.open_date ? new Date(data.open_date) : null,
              useWellWater: data.use_well_water,
              createdAt: new Date(data.created_at),
              updatedAt: new Date(data.updated_at),
            }

            set((state) => ({
              projects: [...state.projects, newProject],
              currentProjectId: newProject.id,
              currentProject: newProject,
            }))

            useAutoSaveStore.getState().setSaved()
            return newProject.id
          } catch (error) {
            console.error("Error adding project:", error)
            useAutoSaveStore.getState().setError()
            return undefined
          }
        },

        selectProject: (id: string) => {
          const project = get().projects.find((p) => p.id === id) || null
          set({ currentProjectId: id, currentProject: project })
        },

        updateProjectName: async (id: string, name: string) => {
          useAutoSaveStore.getState().setSaving()
          try {
            const { error } = await supabaseClient
              .from("projects")
              .update({ name, updated_at: new Date().toISOString() })
              .eq("id", id)

            if (error) throw error

            set((state) => ({
              projects: state.projects.map((p) => (p.id === id ? { ...p, name, updatedAt: new Date() } : p)),
              currentProject:
                state.currentProject?.id === id
                  ? { ...state.currentProject, name, updatedAt: new Date() }
                  : state.currentProject,
            }))
            useAutoSaveStore.getState().setSaved()
          } catch (error) {
            console.error("Error updating project name:", error)
            useAutoSaveStore.getState().setError()
          }
        },

        updateProjectOpenDate: async (id: string, openDate: Date) => {
          useAutoSaveStore.getState().setSaving()
          try {
            const { error } = await supabaseClient
              .from("projects")
              .update({ open_date: openDate.toISOString(), updated_at: new Date().toISOString() })
              .eq("id", id)

            if (error) throw error

            set((state) => ({
              projects: state.projects.map((p) => (p.id === id ? { ...p, openDate, updatedAt: new Date() } : p)),
              currentProject:
                state.currentProject?.id === id
                  ? { ...state.currentProject, openDate, updatedAt: new Date() }
                  : state.currentProject,
            }))
            useAutoSaveStore.getState().setSaved()
          } catch (error) {
            console.error("Error updating project open date:", error)
            useAutoSaveStore.getState().setError()
          }
        },

        updateProjectUseWellWater: async (id: string, useWellWater: boolean) => {
          useAutoSaveStore.getState().setSaving()
          try {
            const { error } = await supabaseClient
              .from("projects")
              .update({ use_well_water: useWellWater, updated_at: new Date().toISOString() })
              .eq("id", id)

            if (error) throw error

            set((state) => ({
              projects: state.projects.map((p) => (p.id === id ? { ...p, useWellWater, updatedAt: new Date() } : p)),
              currentProject:
                state.currentProject?.id === id
                  ? { ...state.currentProject, useWellWater, updatedAt: new Date() }
                  : state.currentProject,
            }))
            useAutoSaveStore.getState().setSaved()
          } catch (error) {
            console.error("Error updating project use well water:", error)
            useAutoSaveStore.getState().setError()
          }
        },

        deleteProject: async (id: string) => {
          useAutoSaveStore.getState().setSaving()
          try {
            const { error } = await supabaseClient.from("projects").delete().eq("id", id)

            if (error) throw error

            const { projects, currentProjectId } = get()
            const filteredProjects = projects.filter((p) => p.id !== id)

            let newCurrentId = currentProjectId
            let newCurrentProject = null

            if (currentProjectId === id) {
              if (filteredProjects.length > 0) {
                newCurrentId = filteredProjects[0].id
                newCurrentProject = filteredProjects[0]
              } else {
                newCurrentId = null
              }
            } else if (currentProjectId) {
              newCurrentProject = projects.find((p) => p.id === currentProjectId) || null
            }

            set({
              projects: filteredProjects,
              currentProjectId: newCurrentId,
              currentProject: newCurrentProject,
            })

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
