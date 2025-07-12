"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useProjectStore } from "@/lib/project-store"
import { SettingsPanel } from "@/components/settings-panel"

export function ProjectHeader() {
  const router = useRouter()
  const { currentProject } = useProjectStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleBackClick = () => {
    router.push("/")
  }

  if (!currentProject) {
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBackClick} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{currentProject.name}</h1>
            {currentProject.description && <p className="text-sm text-gray-500">{currentProject.description}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {currentProject.openDate && (
            <div className="text-sm text-gray-600">
              OPEN日: {new Date(currentProject.openDate).toLocaleDateString("ja-JP")}
            </div>
          )}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                設定
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>プロジェクト設定</DialogTitle>
              </DialogHeader>
              <SettingsPanel />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
