"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useProjectStore } from "@/lib/project-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Settings } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SettingsPanel } from "@/components/settings-panel" // SettingsPanelをインポート

type ProjectHeaderProps = {}

export function ProjectHeader({}: ProjectHeaderProps) {
  const router = useRouter()
  const { currentProject, updateProjectName } = useProjectStore()

  if (!currentProject) {
    return null // プロジェクトがロードされていない場合は何も表示しない
  }

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProjectName(currentProject.id, e.target.value)
  }

  return (
    <Card className="rounded-none border-x-0 border-t-0 shadow-sm">
      <CardContent className="p-4 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <input
            type="text"
            value={currentProject.name}
            onChange={handleProjectNameChange}
            className="text-2xl font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0"
            aria-label="プロジェクト名"
          />
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-600">
            OPEN日:{" "}
            <span className="font-medium">
              {currentProject.openDate
                ? format(new Date(currentProject.openDate), "yyyy年MM月dd日", { locale: ja })
                : "未設定"}
            </span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-slate-300 text-slate-600 hover:bg-slate-100 bg-transparent"
                aria-label="プロジェクト設定を開く"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              {" "}
              {/* ダイアログの幅を調整 */}
              <DialogHeader>
                <DialogTitle>プロジェクト設定</DialogTitle>
                <DialogDescription>プロジェクトの基本設定を編集します。</DialogDescription>
              </DialogHeader>
              <SettingsPanel /> {/* SettingsPanel をダイアログコンテンツとして配置 */}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
