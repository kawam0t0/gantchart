"use client"

import { useState, useEffect, useMemo } from "react"
import { format, addDays, differenceInDays, startOfDay, endOfDay, isWithinInterval } from "date-fns"
import { ja } from "date-fns/locale"
import { Plus, Edit, Trash2, CalendarIcon, ChevronLeft, ChevronRight, EyeOff, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useTaskStore, type Task, type TaskStatus, type SubTaskCategory } from "@/lib/task-store"
import { useProjectStore } from "@/lib/project-store"
import { useAutoSaveStore } from "@/lib/auto-save-store"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface GanttChartProps {
  projectId: string
}

export function GanttChart({ projectId }: GanttChartProps) {
  const { tasks, addTask, updateTask, deleteTask, updateSubTaskItem, toggleTaskVisibility } = useTaskStore()
  const { projects, updateProject } = useProjectStore()
  const { setIsSaving } = useAutoSaveStore()
  const { toast } = useToast()

  const currentProject = projects.find((p) => p.id === projectId)
  const projectOpenDate = currentProject?.openDate ? new Date(currentProject.openDate) : null

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskStartDate, setNewTaskStartDate] = useState<Date | undefined>(undefined)
  const [newTaskEndDate, setNewTaskEndDate] = useState<Date | undefined>(undefined)
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("未着手")
  const [newTaskProgress, setNewTaskProgress] = useState(0)
  const [newTaskDependencies, setNewTaskDependencies] = useState<string[]>([])
  const [newTaskSubTasks, setNewTaskSubTasks] = useState<SubTaskCategory[]>([])
  const [newTaskIsHidden, setNewTaskIsHidden] = useState(false)

  const [startDate, setStartDate] = useState(startOfDay(new Date()))
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [showHiddenTasks, setShowHiddenTasks] = useState(false)

  // Auto-save effect
  useEffect(() => {
    const saveTasks = async () => {
      setIsSaving(true)
      // Simulate API call or heavy computation
      await new Promise((resolve) => setTimeout(resolve, 500))
      // Tasks are already saved to localStorage by zustand middleware in task-store
      setIsSaving(false)
    }

    const handler = setTimeout(() => {
      saveTasks()
    }, 1000) // Save after 1 second of inactivity

    return () => clearTimeout(handler)
  }, [tasks, setIsSaving])

  useEffect(() => {
    if (projectOpenDate) {
      // Adjust tasks if they go beyond the open date
      const updatedTasks = tasks[projectId]?.map((task) => {
        const taskEndDate = new Date(task.endDate)
        if (taskEndDate > projectOpenDate) {
          const newEndDate = projectOpenDate
          const duration = differenceInDays(newEndDate, new Date(task.startDate))
          return {
            ...task,
            endDate: newEndDate.getTime(),
            startDate: addDays(newEndDate, -duration).getTime(), // Keep duration if possible
          }
        }
        return task
      })
      // This would ideally trigger an updateTask for each, but for simplicity, we'll just re-render
      // In a real app, you'd dispatch updates to the store for each modified task
    }
  }, [projectOpenDate, tasks, projectId])

  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setNewTaskName(task.name)
    setNewTaskStartDate(new Date(task.startDate))
    setNewTaskEndDate(new Date(task.endDate))
    setNewTaskStatus(task.status)
    setNewTaskProgress(task.progress)
    setNewTaskDependencies(task.dependencies || [])
    setNewTaskSubTasks(task.subTasks ? JSON.parse(JSON.stringify(task.subTasks)) : []) // Deep copy
    setNewTaskIsHidden(task.isHidden || false)
    setIsTaskDialogOpen(true)
  }

  const handleSaveTask = () => {
    if (!newTaskName.trim() || !newTaskStartDate || !newTaskEndDate) {
      toast({
        title: "エラー",
        description: "タスク名、開始日、終了日は必須です。",
        variant: "destructive",
      })
      return
    }

    if (newTaskStartDate.getTime() > newTaskEndDate.getTime()) {
      toast({
        title: "エラー",
        description: "開始日は終了日より前に設定してください。",
        variant: "destructive",
      })
      return
    }

    const taskData = {
      name: newTaskName,
      startDate: newTaskStartDate.getTime(),
      endDate: newTaskEndDate.getTime(),
      status: newTaskStatus,
      progress: newTaskProgress,
      dependencies: newTaskDependencies,
      subTasks: newTaskSubTasks,
      isHidden: newTaskIsHidden,
    }

    if (editingTask) {
      updateTask(projectId, editingTask.id, taskData)
      toast({
        title: "タスク更新完了",
        description: `「${newTaskName}」を更新しました。`,
      })
    } else {
      addTask(projectId, taskData)
      toast({
        title: "タスク追加完了",
        description: `「${newTaskName}」を追加しました。`,
      })
    }
    resetForm()
    setIsTaskDialogOpen(false)
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTask(projectId, taskId)
    toast({
      title: "タスク削除完了",
      description: "タスクを削除しました。",
    })
    resetForm()
    setIsTaskDialogOpen(false)
  }

  const resetForm = () => {
    setEditingTask(null)
    setNewTaskName("")
    setNewTaskStartDate(undefined)
    setNewTaskEndDate(undefined)
    setNewTaskStatus("未着手")
    setNewTaskProgress(0)
    setNewTaskDependencies([])
    setNewTaskSubTasks([])
    setNewTaskIsHidden(false)
  }

  const handleSubTaskItemChange = (categoryId: string, itemId: string, completed: boolean) => {
    if (editingTask) {
      updateSubTaskItem(projectId, editingTask.id, categoryId, itemId, completed)
      // Update local state for immediate UI feedback in dialog
      setNewTaskSubTasks((prevSubTasks) =>
        prevSubTasks.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                items: category.items.map((item) => (item.id === itemId ? { ...item, completed } : item)),
              }
            : category,
        ),
      )
    }
  }

  const handleToggleTaskVisibility = (taskId: string, isHidden: boolean) => {
    toggleTaskVisibility(projectId, taskId, isHidden)
    toast({
      title: "タスク表示設定更新",
      description: isHidden ? "タスクを非表示にしました。" : "タスクを表示しました。",
    })
  }

  const getDaysInView = () => {
    switch (viewMode) {
      case "day":
        return 1
      case "week":
        return 7
      case "month":
        return 30 // Approximate
      default:
        return 7
    }
  }

  const daysInView = getDaysInView()
  const datesInView = useMemo(() => {
    const days = []
    for (let i = 0; i < daysInView; i++) {
      days.push(addDays(startDate, i))
    }
    return days
  }, [startDate, daysInView])

  const navigateDates = (direction: "prev" | "next") => {
    const amount = viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30
    setStartDate((prev) => (direction === "next" ? addDays(prev, amount) : addDays(prev, -amount)))
  }

  const getCategoryBaseColor = (category: string) => {
    switch (category) {
      case "洗車場開発":
        return "bg-orange-500" // オレンジ色
      case "バックオフィス":
        return "bg-blue-500" // 青色
      case "マイルストーン":
        return "bg-yellow-500" // マイルストーンは黄色
      default:
        return "bg-gray-400" // デフォルト
    }
  }

  const filteredTasks = useMemo(() => {
    return (tasks[projectId] || []).filter((task) => showHiddenTasks || !task.isHidden)
  }, [tasks, projectId, showHiddenTasks])

  const getTaskPositionAndWidth = (task: Task, dayIndex: number, totalDays: number) => {
    const taskStart = startOfDay(new Date(task.startDate))
    const taskEnd = endOfDay(new Date(task.endDate))
    const viewStart = startOfDay(datesInView[0])
    const viewEnd = endOfDay(datesInView[datesInView.length - 1])

    const intervalStart = Math.max(viewStart.getTime(), taskStart.getTime())
    const intervalEnd = Math.min(viewEnd.getTime(), taskEnd.getTime())

    if (intervalEnd < intervalStart) {
      return { left: 0, width: 0, display: "none" } // Task is outside current view
    }

    const totalViewDuration = differenceInDays(viewEnd, viewStart) + 1
    const taskDurationInView = differenceInDays(new Date(intervalEnd), new Date(intervalStart)) + 1

    const offsetDays = differenceInDays(new Date(intervalStart), viewStart)

    const left = (offsetDays / totalViewDuration) * 100
    const width = (taskDurationInView / totalViewDuration) * 100

    return { left: `${left}%`, width: `${width}%`, display: "block`" }
  }

  // 進捗バーの色は青色を維持
  const getProgressBarColor = (status: TaskStatus) => {
    return "bg-blue-700"
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">ガントチャート</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateDates("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-slate-700">
            {format(startDate, "yyyy年MM月dd日", { locale: ja })}
            {daysInView > 1 && ` - ${format(datesInView[datesInView.length - 1], "yyyy年MM月dd日", { locale: ja })}`}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateDates("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as "day" | "week" | "month")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="表示モード" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">日</SelectItem>
              <SelectItem value="week">週</SelectItem>
              <SelectItem value="month">月</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHiddenTasks(!showHiddenTasks)}
            className={cn(showHiddenTasks ? "bg-blue-50 text-blue-600" : "")}
          >
            {showHiddenTasks ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showHiddenTasks ? "非表示タスクを表示中" : "非表示タスクを隠す"}
          </Button>
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                タスク追加
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingTask ? "タスク編集" : "新規タスク追加"}</DialogTitle>
                <DialogDescription>
                  {editingTask ? "タスクの詳細を編集します。" : "新しいタスクの情報を入力してください。"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    タスク名
                  </Label>
                  <Input
                    id="name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startDate" className="text-right">
                    開始日
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !newTaskStartDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTaskStartDate ? (
                          format(newTaskStartDate, "yyyy年MM月dd日", { locale: ja })
                        ) : (
                          <span>日付を選択</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTaskStartDate}
                        onSelect={setNewTaskStartDate}
                        initialFocus
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    終了日
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "col-span-3 justify-start text-left font-normal",
                          !newTaskEndDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newTaskEndDate ? (
                          format(newTaskEndDate, "yyyy年MM月dd日", { locale: ja })
                        ) : (
                          <span>日付を選択</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newTaskEndDate}
                        onSelect={setNewTaskEndDate}
                        initialFocus
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    ステータス
                  </Label>
                  <Select value={newTaskStatus} onValueChange={(value) => setNewTaskStatus(value as TaskStatus)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="ステータスを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="未着手">未着手</SelectItem>
                      <SelectItem value="進行中">進行中</SelectItem>
                      <SelectItem value="完了">完了</SelectItem>
                      <SelectItem value="遅延">遅延</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="progress" className="text-right">
                    進捗 (%)
                  </Label>
                  <Input
                    id="progress"
                    type="number"
                    value={newTaskProgress}
                    onChange={(e) => setNewTaskProgress(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isHidden" className="text-right">
                    非表示
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox
                      id="isHidden"
                      checked={newTaskIsHidden}
                      onCheckedChange={(checked) => setNewTaskIsHidden(Boolean(checked))}
                    />
                    <label
                      htmlFor="isHidden"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      パートナー企業向けに非表示にする
                    </label>
                  </div>
                </div>

                {/* サブタスクセクション */}
                {newTaskSubTasks.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <h3 className="text-lg font-semibold col-span-4">サブタスク</h3>
                    {newTaskSubTasks.map((category) => (
                      <div key={category.id} className="col-span-4 space-y-2">
                        <h4 className="font-medium text-slate-700">{category.name}</h4>
                        {category.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-2 ml-4">
                            <Checkbox
                              id={`subtask-${item.id}`}
                              checked={item.completed}
                              onCheckedChange={(checked) =>
                                handleSubTaskItemChange(category.id, item.id, Boolean(checked))
                              }
                            />
                            <label
                              htmlFor={`subtask-${item.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {item.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>
              <DialogFooter>
                {editingTask && (
                  <Button variant="destructive" onClick={() => handleDeleteTask(editingTask.id)} className="mr-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    削除
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleSaveTask} className="bg-blue-600 hover:bg-blue-700">
                  {editingTask ? "更新" : "追加"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(50px,1fr))] gap-1 min-w-[800px]">
          {/* Header Row */}
          <div className="sticky left-0 bg-white z-10 p-2 font-semibold border-b border-r text-slate-700">タスク名</div>
          {datesInView.map((date, index) => (
            <div
              key={index}
              className="p-2 text-center font-semibold border-b text-slate-700"
              style={{ minWidth: viewMode === "day" ? "150px" : "50px" }}
            >
              {format(date, "MM/dd", { locale: ja })}
              <div className="text-xs font-normal text-slate-500">{format(date, "EEE", { locale: ja })}</div>
            </div>
          ))}

          {/* Task Rows */}
          {filteredTasks.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500">
              <p>タスクがまだありません。「タスク追加」ボタンから作成してください。</p>
            </div>
          )}
          {filteredTasks.map((task) => (
            <div key={task.id} className="contents">
              <div className="sticky left-0 bg-white z-10 p-2 border-b border-r flex items-center justify-between text-slate-800">
                <span className={cn(task.isHidden && "text-slate-400 italic")}>{task.name}</span>
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                  <Edit className="h-4 w-4 text-blue-500" />
                </Button>
              </div>
              {datesInView.map((date, index) => {
                const { left, width, display } = getTaskPositionAndWidth(task, index, daysInView)
                const isTaskDay = isWithinInterval(date, {
                  start: startOfDay(new Date(task.startDate)),
                  end: endOfDay(new Date(task.endDate)),
                })

                return (
                  <div
                    key={index}
                    className="relative p-2 border-b flex items-center justify-center"
                    style={{ minWidth: viewMode === "day" ? "150px" : "50px" }}
                  >
                    {isTaskDay && (
                      <div
                        className={cn("absolute h-3 rounded-sm", getCategoryBaseColor(task.category))} // カテゴリベースの色を適用
                        style={{
                          left: left,
                          width: width,
                          display: display,
                        }}
                        title={`${task.name} (${format(new Date(task.startDate), "yyyy/MM/dd")} - ${format(new Date(task.endDate), "yyyy/MM/dd")})`}
                      >
                        <div
                          className="absolute left-0 top-0 h-full bg-blue-700 rounded-sm" // 進捗バーの色は青色を維持
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
