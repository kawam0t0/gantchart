"use client"

import { useState } from "react"
import { useProjectStore } from "@/lib/project-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Edit2, Check, X, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { SettingsPanel } from "@/components/settings-panel"

export function ProjectHeader() {
  const router = useRouter()
  const { currentProject, updateProjectName } = useProjectStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  if (!currentProject) return null

  const handleStartEdit = () => {
    setEditName(currentProject.name)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (editName.trim() && editName !== currentProject.name) {
      await updateProjectName(currentProject.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditName("")
    setIsEditing(false)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "未設定"
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>戻る</span>
          </Button>

          <div className="flex items-center space-x-2">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-bold"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit()
                    if (e.key === "Escape") handleCancelEdit()
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
                <Button size="sm" variant="ghost" onClick={handleStartEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">OPEN日:</span> {formatDate(currentProject.openDate)}
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">井戸水:</span> {currentProject.useWellWater ? "あり" : "なし"}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>設定</span>
          </Button>
        </div>
      </div>

      <SettingsPanel open={showSettings} onOpenChange={setShowSettings} />
    </>
  )
}
