"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { ArrowLeft, CalendarIcon, Edit2 } from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/project-store"
import { Badge } from "@/components/ui/badge"
import { AutoSaveIndicator } from "@/components/auto-save-indicator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTaskStore } from "@/lib/task-store"
import { cn } from "@/lib/utils"

export function ProjectHeader() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentProject, updateProjectName, updateProjectOpenDate } = useProjectStore()
  const { tasks, setTasks } = useTaskStore()

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [isOpenDateDialogOpen, setIsOpenDateDialogOpen] = useState(false)
  const [newOpenDate, setNewOpenDate] = useState<Date | undefined>(undefined)
  const [daysUntilOpen, setDaysUntilOpen] = useState(0)

  // OPEN日までの日数を計算する関数
  const getDaysUntilOpen = (openDate: Date) => {
    if (!openDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffTime = Math.abs(openDate.getTime() - today.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // currentProjectが変更されたら日数を再計算
  useEffect(() => {
    if (currentProject?.openDate) {
      const calculatedDays = getDaysUntilOpen(new Date(currentProject.openDate))
      setDaysUntilOpen(calculatedDays || 0)
    }
  }, [currentProject])

  const handleRenameProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "エラー",
        description: "プロジェクト名を入力してください",
        variant: "destructive",
      })
      return
    }

    if (!currentProject) return

    await updateProjectName(currentProject.id, newProjectName) // 非同期処理を待つ
    setNewProjectName("")
    setIsRenameDialogOpen(false)

    toast({
      title: "プロジェクト名変更完了",
      description: `プロジェクト名を「${newProjectName}」に変更しました`,
    })
  }

  const openRenameDialog = () => {
    if (!currentProject) return
    setNewProjectName(currentProject.name)
    setIsRenameDialogOpen(true)
  }

  // OPEN日変更ダイアログを開く
  const openChangeDateDialog = () => {
    if (currentProject?.openDate) {
      setNewOpenDate(new Date(currentProject.openDate))
    } else {
      setNewOpenDate(new Date())
    }
    setIsOpenDateDialogOpen(true)
  }

  // OPEN日を変更（既存タスクの自動調整機能付き）
  const handleChangeOpenDate = async () => {
    if (!newOpenDate || !currentProject) return

    const oldOpenDate = currentProject.openDate ? new Date(currentProject.openDate) : null

    // OPEN日を更新
    await updateProjectOpenDate(currentProject.id, newOpenDate) // 非同期処理を待つ

    // 既存のタスクがある場合、自動調整
    if (oldOpenDate && tasks.length > 0) {
      await adjustExistingTasks(oldOpenDate, newOpenDate) // 非同期処理を待つ
    }

    setIsOpenDateDialogOpen(false)

    toast({
      title: "OPEN日変更完了",
      description: `OPEN日を${format(newOpenDate, "yyyy年MM月dd日", { locale: ja })}に変更しました${
        oldOpenDate && tasks.length > 0 ? "。既存タスクのスケジュールも自動調整されました。" : ""
      }`,
    })
  }

  // 既存タスクの日付を自動調整する関数
  const adjustExistingTasks = async (oldOpenDate: Date, newOpenDate: Date) => {
    if (tasks.length === 0 || !currentProject) return

    // 日付の差分を計算（ミリ秒）
    const dateDiff = newOpenDate.getTime() - oldOpenDate.getTime()

    // すべてのタスクの日付を調整し、Supabaseを更新
    const updatePromises = tasks.map(async (task) => {
      const startDate = new Date(task.startDate)
      const endDate = new Date(task.endDate)

      startDate.setTime(startDate.getTime() + dateDiff)
      endDate.setTime(endDate.getTime() + dateDiff)

      await useTaskStore.getState().updateTask(currentProject.id, task.id, {
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
      })
    })

    await Promise.all(updatePromises) // すべての更新が完了するのを待つ

    toast({
      title: "スケジュール更新",
      description: `OPEN日の変更に合わせてスケジュールを調整しました`,
    })
  }

  if (!currentProject) return null

  return (
    <div className="bg-white p-4 rounded-lg border shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="mr-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div>
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-slate-800">{currentProject.name}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={openRenameDialog}
                className="ml-1 text-slate-400 hover:text-slate-700"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            {currentProject.openDate && (
              <div className="space-y-2 mt-1">
                <div className="flex items-center text-sm text-slate-600">
                  <CalendarIcon className="h-4 w-4 mr-1 text-blue-500" />
                  <span>OPEN日: {format(new Date(currentProject.openDate), "yyyy年MM月dd日", { locale: ja })}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={openChangeDateDialog}
                    className="ml-1 text-slate-400 hover:text-slate-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="text-xs font-medium">
                  OPENまであと{daysUntilOpen}日！
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <AutoSaveIndicator />
        </div>
      </div>

      {/* 名前変更ダイアログ */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プロジェクト名変更</DialogTitle>
            <DialogDescription>新しいプロジェクト名を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder={currentProject.name}
              className="border-slate-300"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleRenameProject} className="bg-blue-600 hover:bg-blue-700">
              変更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OPEN日変更ダイアログ */}
      <Dialog open={isOpenDateDialogOpen} onOpenChange={setIsOpenDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>OPEN日変更</DialogTitle>
            <DialogDescription>
              新しいOPEN日を選択してください。既存のタスクがある場合、スケジュールが自動的に調整されます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal border-slate-300",
                    !newOpenDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                  {newOpenDate ? format(newOpenDate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={newOpenDate} onSelect={setNewOpenDate} locale={ja} />
              </PopoverContent>
            </Popover>
            {tasks.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  📅 既存の{tasks.length}個のタスクのスケジュールが自動的に調整されます
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenDateDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleChangeOpenDate} className="bg-blue-600 hover:bg-blue-700">
              変更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
