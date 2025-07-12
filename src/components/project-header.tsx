"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format, differenceInDays } from "date-fns"
import { ja } from "date-fns/locale"
import { ArrowLeft, Settings, Edit } from "lucide-react"
import { useProjectStore } from "@/lib/project-store"
import { useAutoSaveStore } from "@/lib/auto-save-store"
import { AutoSaveIndicator } from "./auto-save-indicator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SettingsPanel } from "./settings-panel"

interface ProjectHeaderProps {
  projectId: string
}

export function ProjectHeader({ projectId }: ProjectHeaderProps) {
  const { projects, updateProjectName } = useProjectStore()
  const { isSaving } = useAutoSaveStore()
  const currentProject = projects.find((p) => p.id === projectId)

  const [isEditingName, setIsEditingName] = useState(false)
  const [projectName, setProjectName] = useState(currentProject?.name || "")
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)

  useEffect(() => {
    if (currentProject) {
      setProjectName(currentProject.name)
    }
  }, [currentProject])

  const handleNameChange = () => {
    if (currentProject && projectName.trim() !== currentProject.name) {
      updateProjectName(currentProject.id, projectName.trim())
    }
    setIsEditingName(false)
  }

  const openDate = currentProject?.openDate ? new Date(currentProject.openDate) : null
  const today = new Date()
  const daysUntilOpen = openDate ? differenceInDays(openDate, today) : null

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-slate-600 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">プロジェクト一覧に戻る</span>
        </Link>
        <div className="flex items-center space-x-2">
          {isEditingName ? (
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={handleNameChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleNameChange()
                }
              }}
              className="text-xl font-bold text-slate-800 w-64"
              autoFocus
            />
          ) : (
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {currentProject?.name || "プロジェクト名"}
              <Button variant="ghost" size="icon" onClick={() => setIsEditingName(true)} className="h-6 w-6">
                <Edit className="h-4 w-4 text-slate-500" />
                <span className="sr-only">プロジェクト名を編集</span>
              </Button>
            </h1>
          )}
        </div>
        {openDate && (
          <div className="text-sm text-slate-600 flex items-center space-x-2">
            <span className="font-medium">OPEN日:</span>
            <span>{format(openDate, "yyyy年MM月dd日", { locale: ja })}</span>
            {daysUntilOpen !== null && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                OPENまであと{daysUntilOpen}日！
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <AutoSaveIndicator isSaving={isSaving} />
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-800">
              <Settings className="h-5 w-5" />
              <span className="sr-only">プロジェクト設定</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>プロジェクト設定</DialogTitle>
              <DialogDescription>プロジェクトの基本設定を編集します。</DialogDescription>
            </DialogHeader>
            <SettingsPanel />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
