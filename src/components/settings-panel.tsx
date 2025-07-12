"use client"

import { useState } from "react"
import { useProjectStore } from "@/lib/project-store"
import { useTaskStore } from "@/lib/task-store"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { currentProject, updateProjectOpenDate, updateProjectUseWellWater, deleteProject } = useProjectStore()
  const { deleteAllTasksForProject } = useTaskStore()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentProject?.openDate || undefined)

  if (!currentProject) return null

  const handleDateSelect = async (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      await updateProjectOpenDate(currentProject.id, date)
    }
  }

  const handleWellWaterToggle = async (checked: boolean) => {
    await updateProjectUseWellWater(currentProject.id, checked)
  }

  const handleDeleteAllTasks = async () => {
    if (confirm("すべてのタスクを削除しますか？この操作は元に戻せません。")) {
      await deleteAllTasksForProject(currentProject.id)
    }
  }

  const handleDeleteProject = async () => {
    if (confirm(`プロジェクト「${currentProject.name}」を削除しますか？この操作は元に戻せません。`)) {
      await deleteProject(currentProject.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>プロジェクト設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* OPEN日設定 */}
          <div className="space-y-2">
            <Label htmlFor="open-date">OPEN日</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: ja }) : <span>日付を選択</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* 井戸水使用設定 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="well-water">井戸水</Label>
            <Switch id="well-water" checked={currentProject.useWellWater} onCheckedChange={handleWellWaterToggle} />
          </div>

          {/* 危険な操作 */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-red-600">危険な操作</h3>

            <Button variant="destructive" size="sm" onClick={handleDeleteAllTasks} className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              すべてのタスクを削除
            </Button>

            <Button variant="destructive" size="sm" onClick={handleDeleteProject} className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              プロジェクトを削除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
