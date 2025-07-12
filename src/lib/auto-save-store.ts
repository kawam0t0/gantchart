"use client"

import { create } from "zustand"

type SaveStatus = "idle" | "saving" | "saved" | "error"

type AutoSaveStore = {
  status: SaveStatus
  lastSaved: Date | null
  setSaving: () => void
  setSaved: () => void
  setError: () => void
}

export const useAutoSaveStore = create<AutoSaveStore>((set) => ({
  status: "idle",
  lastSaved: null,
  setSaving: () => set({ status: "saving" }),
  setSaved: () => set({ status: "saved", lastSaved: new Date() }),
  setError: () => set({ status: "error" }),
}))
