"use client"

import type React from "react"

import { useEffect, useRef, useState, useMemo } from "react"
import { addDays, differenceInDays, format, isAfter, isBefore, isSameDay, eachDayOfInterval } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Calendar, Edit2, Trash2, Info, EyeOff, Eye } from "lucide-react" // EyeOff, Eyeを追加

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox" // Checkboxを追加
import { useTaskStore, type Task, type SubTaskCategory } from "@/lib/task-store"
import { useProjectStore } from "@/lib/project-store"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast" // useToastを追加

// 期間を表示するためのヘルパー関数
const formatDuration = (startDate: number, endDate: number) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = differenceInDays(end, start) + 1

  if (days <= 0) return ""

  if (days < 7) {
    return `${days}日間`
  } else if (days < 30) {
    const weeks = Math.round(days / 7)
    return `${weeks}週間`
  } else if (days < 365) {
    const months = Math.round(days / 30)
    if (days % 30 > 15) {
      return `${Math.floor(days / 30)}ヶ月半`
    } else {
      return `${months}ヶ月`
    }
  } else {
    const years = Math.round(days / 365)
    return `${years}年`
  }
}

type GanttChartProps = {}

export function GanttChart({}: GanttChartProps) {
  const { tasks, addTask, updateTask, deleteTask, updateSubTaskItem, toggleTaskVisibility, setTasks } = useTaskStore() // setTasksを追加
  const { currentProject, currentProjectId } = useProjectStore()
  const { toast } = useToast()

  // viewStartDateの初期値を安全に設定
  const [viewStartDate, setViewStartDate] = useState(() => {
    const currentOpenDate = currentProject?.openDate ? new Date(currentProject.openDate) : null
    if (currentOpenDate && !isNaN(currentOpenDate.getTime())) {
      const fourMonthsBefore = new Date(currentOpenDate)
      fourMonthsBefore.setMonth(currentOpenDate.getMonth() - 4)
      return fourMonthsBefore
    }
    return new Date()
  })

  const [editingTask, setEditingTask] = useState<Task | null>(null) // Task型を使用
  const [newTask, setNewTask] = useState({
    name: "",
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
    category: "洗車場開発",
    color: "#f97316", // ここをオレンジ色にデフォルト設定
    memo: "",
    isHidden: false,
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [dragInfo, setDragInfo] = useState<any>(null)

  // ホバー状態の管理
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showHiddenTasks, setShowHiddenTasks] = useState(false) // 非表示タスクの表示切り替え

  const ganttRef = useRef<HTMLDivElement>(null)

  // OPEN日を取得
  const openDate = currentProject?.openDate ? new Date(currentProject.openDate) : null

  // 固定で180日表示
  const daysToShow = 180

  const dateRange = useMemo(() => {
    const viewEnd = addDays(viewStartDate, daysToShow - 1)

    return eachDayOfInterval({
      start: viewStartDate,
      end: viewEnd,
    })
  }, [viewStartDate, daysToShow])

  // 表示期間を移動
  const moveViewRange = (days: number) => {
    setViewStartDate(addDays(viewStartDate, days))
  }

  // タスクのスタイル関数
  const getTaskStyle = (task: Task) => {
    // Task型を使用
    const startDate = new Date(task.startDate)
    const endDate = new Date(task.endDate)

    // 日付が無効な場合は非表示
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { display: "none" }
    }

    // 表示範囲外のタスクは表示しない
    const viewEndDate = addDays(viewStartDate, daysToShow - 1)
    if (isAfter(startDate, viewEndDate) || isBefore(endDate, viewStartDate)) {
      return { display: "none" }
    }

    // 開始位置を計算（表示範囲内での相対位置）
    const startOffset = Math.max(0, differenceInDays(startDate, viewStartDate))
    // 期間を計算
    const taskDuration = differenceInDays(endDate, startDate) + 1
    // 表示可能な期間を計算
    const visibleDuration = Math.min(taskDuration, daysToShow - startOffset)

    return {
      left: `${startOffset * 40}px`,
      width: `${Math.max(visibleDuration * 40 - 4, 20)}px`, // 最小幅を20pxに設定
      backgroundColor: task.color || "#3b82f6", // task.colorが設定されていない場合のデフォルトを青に設定
      transition: "all 0.2s ease-in-out",
      boxShadow: hoveredTaskId === task.id ? "0 4px 12px 0 rgba(0, 0, 0, 0.15)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      position: "absolute" as const,
      top: "2px",
      height: "32px",
      zIndex: hoveredTaskId === task.id ? 1000 : 10,
      transform: hoveredTaskId === task.id ? "translateY(-1px)" : "translateY(0)",
    }
  }

  // ホバー開始
  const handleMouseEnter = (e: React.MouseEvent, task: Task) => {
    // Task型を使用
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left,
      y: rect.top - 10,
    })

    setHoveredTaskId(task.id)
  }

  // ホバー終了
  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredTaskId(null)
    }, 100) // 100ms の遅延を追加
  }

  // ツールチップのマウスエンター（ツールチップ内にマウスがある間は表示を維持）
  const handleTooltipMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
  }

  // ツールチップのマウスリーブ
  const handleTooltipMouseLeave = () => {
    setHoveredTaskId(null)
  }

  // ドラッグ開始
  const handleDragStart = (e: React.MouseEvent, task: Task, type: string) => {
    // Task型を使用
    e.stopPropagation()
    setHoveredTaskId(null) // ドラッグ開始時にツールチップを非表示
    setDragInfo({
      taskId: task.id,
      type,
      initialX: e.clientX,
      initialStartDate: new Date(task.startDate),
      initialEndDate: new Date(task.endDate),
    })
  }

  // ドラッグ中
  const handleDrag = async (e: MouseEvent) => {
    // 非同期に変更
    if (!dragInfo || !currentProjectId) return

    const deltaX = e.clientX - dragInfo.initialX
    const daysDelta = Math.round(deltaX / 40)

    if (daysDelta === 0) return

    const taskIndex = tasks.findIndex((t) => t.id === dragInfo.taskId)
    if (taskIndex === -1) return

    const task = { ...tasks[taskIndex] }
    let newStartDate = new Date(task.startDate)
    let newEndDate = new Date(task.endDate)

    if (dragInfo.type === "move") {
      newStartDate = addDays(dragInfo.initialStartDate, daysDelta)
      newEndDate = addDays(dragInfo.initialEndDate, daysDelta)
    } else if (dragInfo.type === "resize-start") {
      const calculatedStartDate = addDays(dragInfo.initialStartDate, daysDelta)
      if (isBefore(calculatedStartDate, newEndDate)) {
        newStartDate = calculatedStartDate
      }
    } else if (dragInfo.type === "resize-end") {
      const calculatedEndDate = addDays(dragInfo.initialEndDate, daysDelta)
      if (isAfter(calculatedEndDate, newStartDate)) {
        newEndDate = calculatedEndDate
      }
    }

    // Supabaseを更新
    await updateTask(currentProjectId, task.id, {
      startDate: newStartDate.getTime(),
      endDate: newEndDate.getTime(),
    })

    // ドラッグ中のUIフィードバックのためにローカル状態を更新（リアルタイム購読が追いつくまでの間）
    setTasks(
      tasks.map((t) =>
        t.id === task.id ? { ...t, startDate: newStartDate.getTime(), endDate: newEndDate.getTime() } : t,
      ),
    )

    // ドラッグ情報のリセットを遅延させることで、連続ドラッグに対応
    setDragInfo({ ...dragInfo, initialX: e.clientX, initialStartDate: newStartDate, initialEndDate: newEndDate })
  }

  // ドラッグ終了
  const handleDragEnd = () => {
    setDragInfo(null)
  }

  // マウスイベントのセットアップ
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragInfo) {
        handleDrag(e)
      }
    }
    const handleMouseUp = () => handleDragEnd()

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragInfo, tasks, currentProjectId]) // tasksとcurrentProjectIdを依存配列に追加

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // タスク編集ダイアログを開く
  const openEditDialog = (task: Task) => {
    // Task型を使用
    setEditingTask(task)
    setIsEditDialogOpen(true)
  }

  // 新しいタスクを追加
  const handleAddTask = async () => {
    // 非同期に変更
    if (!currentProjectId) {
      toast({
        title: "エラー",
        description: "プロジェクトが選択されていません。",
        variant: "destructive",
      })
      return
    }
    if (!newTask.name.trim() || !newTask.startDate || !newTask.endDate) {
      toast({
        title: "エラー",
        description: "タスク名、開始日、終了日は必須です。",
        variant: "destructive",
      })
      return
    }
    if (newTask.startDate.getTime() > newTask.endDate.getTime()) {
      toast({
        title: "エラー",
        description: "開始日は終了日より前に設定してください。",
        variant: "destructive",
      })
      return
    }

    await addTask(currentProjectId, {
      // 非同期処理を待つ
      name: newTask.name,
      startDate: newTask.startDate.getTime(),
      endDate: newTask.endDate.getTime(),
      category: newTask.category,
      subTasks: newTask.subTasks,
      isHidden: newTask.isHidden,
    })
    setNewTask({
      name: "",
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      category: "洗車場開発",
      color: "#f97316",
      memo: "",
      isHidden: false,
    })
    setIsAddDialogOpen(false)
    toast({
      title: "タスク追加完了",
      description: `「${newTask.name}」を追加しました。`,
    })
  }

  // タスクを更新
  const handleUpdateTask = async () => {
    // 非同期に変更
    if (!editingTask || !currentProjectId) return
    if (!editingTask.name.trim() || !editingTask.startDate || !editingTask.endDate) {
      toast({
        title: "エラー",
        description: "タスク名、開始日、終了日は必須です。",
        variant: "destructive",
      })
      return
    }
    if (editingTask.startDate > editingTask.endDate) {
      toast({
        title: "エラー",
        description: "開始日は終了日より前に設定してください。",
        variant: "destructive",
      })
      return
    }

    await updateTask(currentProjectId, editingTask.id, {
      // 非同期処理を待つ
      name: editingTask.name,
      startDate: editingTask.startDate,
      endDate: editingTask.endDate,
      category: editingTask.category,
      color: editingTask.color,
      memo: editingTask.memo,
      subTasks: editingTask.subTasks,
      isHidden: editingTask.isHidden,
    })
    setIsEditDialogOpen(false)
    toast({
      title: "タスク更新完了",
      description: `「${editingTask.name}」を更新しました。`,
    })
  }

  // タスクを削除
  const handleDeleteTask = async () => {
    // 非同期に変更
    if (!editingTask || !currentProjectId) return
    if (window.confirm(`タスク「${editingTask.name}」を本当に削除しますか？`)) {
      await deleteTask(currentProjectId, editingTask.id) // 非同期処理を待つ
      setIsEditDialogOpen(false)
      toast({
        title: "タスク削除完了",
        description: "タスクを削除しました。",
      })
    }
  }

  // 月の区切りを表示するための関数
  const isFirstDayOfMonth = (date: Date) => {
    return date.getDate() === 1
  }

  // 今日の日付を取得
  const today = new Date()

  // OPEN日からの日数を計算
  const getDaysFromOpenDate = (date: Date) => {
    if (!openDate) return null

    const diffTime = date.getTime() - openDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "OPEN日"
    if (diffDays < 0) return `OPEN日の${Math.abs(diffDays)}日前`
    return `OPEN日の${diffDays}日後`
  }

  // OPEN日がプロジェクトで更新されたら表示期間も調整
  useEffect(() => {
    if (currentProject?.openDate) {
      const openDate = new Date(currentProject.openDate)
      if (!isNaN(openDate.getTime())) {
        const fourMonthsBefore = new Date(openDate)
        fourMonthsBefore.setMonth(openDate.getMonth() - 4)
        setViewStartDate(fourMonthsBefore)
      }
    }
  }, [currentProject?.openDate])

  // グループごとにタスクを整理
  const groupedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => showHiddenTasks || !task.isHidden)
    return filtered.reduce((acc: { [key: string]: Task[] }, task) => {
      if (!acc[task.category]) {
        // groupからcategoryに変更
        acc[task.category] = []
      }
      acc[task.category].push(task)
      return acc
    }, {})
  }, [tasks, showHiddenTasks])

  // ホバー中のタスクを取得
  const hoveredTask = hoveredTaskId ? tasks.find((task) => task.id === hoveredTaskId) : null

  return (
    <div className="bg-white rounded-lg border shadow-lg overflow-hidden relative">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveViewRange(-30)}
            className="border-slate-300 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-700" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => moveViewRange(30)}
            className="border-slate-300 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-slate-700" />
          </Button>
          <span className="text-sm font-medium flex items-center gap-2 text-slate-700">
            <Calendar className="h-4 w-4 text-blue-500" />
            {format(viewStartDate, "yyyy年MM月dd日", { locale: ja })} 〜{" "}
            {format(addDays(viewStartDate, daysToShow - 1), "yyyy年MM月dd日", { locale: ja })}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHiddenTasks(!showHiddenTasks)}
            className={cn(showHiddenTasks ? "bg-blue-50 text-blue-600" : "")}
          >
            {showHiddenTasks ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showHiddenTasks ? "非表示タスクを表示中" : "非表示タスクを隠す"}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-sm">
                <Plus className="h-4 w-4 mr-1" />
                タスク追加
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新しいタスクを追加</DialogTitle>
                <DialogDescription>新しいタスクの詳細を入力してください。</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">タスク名</Label>
                  <Input
                    id="name"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>開始日</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("justify-start text-left font-normal border-slate-300")}
                        >
                          {format(newTask.startDate, "yyyy年MM月dd日", { locale: ja })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={newTask.startDate}
                          onSelect={(date) => date && setNewTask({ ...newTask, startDate: date })}
                          locale={ja}
                        />
                      </PopoverContent>
                    </Popover>
                    {openDate && <p className="text-xs text-slate-500">{getDaysFromOpenDate(newTask.startDate)}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label>終了日</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("justify-start text-left font-normal border-slate-300")}
                        >
                          {format(newTask.endDate, "yyyy年MM月dd日", { locale: ja })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={newTask.endDate}
                          onSelect={(date) => date && setNewTask({ ...newTask, endDate: date })}
                          locale={ja}
                        />
                      </PopoverContent>
                    </Popover>
                    {openDate && <p className="text-xs text-slate-500">{getDaysFromOpenDate(newTask.endDate)}</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">カテゴリ</Label> {/* groupからcategoryに変更 */}
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => {
                      let defaultColor = "#3b82f6" // その他のカテゴリのデフォルト色を青に設定
                      if (value === "洗車場開発") {
                        defaultColor = "#f97316" // 「洗車場開発」はオレンジ
                      }
                      setNewTask({ ...newTask, category: value, color: defaultColor })
                    }}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="マイルストーン">マイルストーン</SelectItem>
                      <SelectItem value="洗車場開発">洗車場開発</SelectItem>
                      <SelectItem value="バックオフィス">バックオフィス</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">色</Label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full ${newTask.color === "#ff9900" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#ff9900" }}
                      onClick={() => setNewTask({ ...newTask, color: "#ff9900" })}
                    />
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full ${newTask.color === "#3b82f6" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#3b82f6" }}
                      onClick={() => setNewTask({ ...newTask, color: "#3b82f6" })}
                    />
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full ${newTask.color === "#8b5cf6" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#8b5cf6" }}
                      onClick={() => setNewTask({ ...newTask, color: "#8b5cf6" })}
                    />
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full ${newTask.color === "#f97316" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#f97316" }}
                      onClick={() => setNewTask({ ...newTask, color: "#f97316" })}
                    />
                    <button
                      type="button"
                      className={`w-8 h-8 rounded-full ${newTask.color === "#ef4444" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#ef4444" }}
                      onClick={() => setNewTask({ ...newTask, color: "#ef4444" })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="memo">メモ</Label>
                  <Textarea
                    id="memo"
                    value={newTask.memo}
                    onChange={(e) => setNewTask({ ...newTask, memo: e.target.value })}
                    placeholder="タスクに関するメモを入力してください"
                    className="border-slate-300 min-h-[100px]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="new-task-is-hidden"
                    checked={newTask.isHidden}
                    onCheckedChange={(checked) => setNewTask({ ...newTask, isHidden: Boolean(checked) })}
                  />
                  <label htmlFor="new-task-is-hidden" className="text-sm font-medium leading-none">
                    パートナー企業向けに非表示にする
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-300">
                  キャンセル
                </Button>
                <Button onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-700">
                  追加
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max relative" ref={ganttRef}>
          {/* ヘッダー部分 - 月と日付 */}
          <div className="flex">
            <div className="w-80 shrink-0 border-r bg-slate-50 sticky left-0 z-20">
              <div className="h-16 border-b px-4 py-2 font-medium text-slate-700 flex items-center">
                <span>タスク</span>
              </div>
            </div>
            <div>
              {/* 月表示 */}
              <div className="flex h-8 border-b">
                {dateRange.map((date, index) => {
                  const isMonthStart = isFirstDayOfMonth(date)

                  if (isMonthStart) {
                    let daysInMonth = 0
                    let tempDate = new Date(date)
                    while (
                      index + daysInMonth < dateRange.length &&
                      (index + daysInMonth === index || !isFirstDayOfMonth(dateRange[index + daysInMonth]))
                    ) {
                      daysInMonth++
                      tempDate = addDays(tempDate, 1)
                    }

                    return (
                      <div
                        key={`month-${index}`}
                        className="h-full flex items-center justify-center bg-blue-50 border-r font-medium text-blue-700"
                        style={{ width: `${daysInMonth * 40}px` }}
                      >
                        {format(date, "yyyy年MM月", { locale: ja })}
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              {/* 日付表示 */}
              <div className="flex">
                {dateRange.map((date, index) => {
                  const isToday = isSameDay(date, today)
                  const isMonthStart = isFirstDayOfMonth(date)
                  const isOpenDay = openDate && isSameDay(date, openDate)

                  return (
                    <div
                      key={`day-${index}`}
                      className={cn(
                        "w-10 shrink-0 text-center text-xs border-r py-2",
                        date.getDay() === 0 ? "bg-red-50" : date.getDay() === 6 ? "bg-blue-50" : "",
                        isMonthStart ? "border-l-2 border-l-blue-300" : "",
                        isToday ? "bg-yellow-50" : "",
                        isOpenDay ? "bg-yellow-100" : "",
                      )}
                    >
                      <div
                        className={cn(
                          "font-medium",
                          isToday
                            ? "text-blue-600 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto"
                            : "",
                          isOpenDay
                            ? "text-amber-600 bg-amber-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto"
                            : "",
                        )}
                      >
                        {format(date, "d", { locale: ja })}
                      </div>
                      <div
                        className={cn(
                          "text-muted-foreground",
                          date.getDay() === 0 ? "text-red-500" : date.getDay() === 6 ? "text-blue-500" : "",
                          isOpenDay ? "text-amber-600 font-bold" : "",
                        )}
                      >
                        {format(date, "E", { locale: ja })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* グループとタスク */}
          {Object.entries(groupedTasks).map(
            (
              [category, groupTasks]: [string, Task[]], // groupからcategoryに変更
            ) => (
              <div key={category}>
                <div className="flex">
                  <div className="w-80 shrink-0 border-r border-b bg-blue-50 px-4 py-2 font-medium text-slate-700 sticky left-0 z-20">
                    {category}
                  </div>
                  <div className="flex border-b">
                    {dateRange.map((date, index) => {
                      const isMonthStart = isFirstDayOfMonth(date)
                      const isToday = isSameDay(date, today)
                      const isOpenDay = openDate && isSameDay(date, openDate)

                      return (
                        <div
                          key={index}
                          className={cn(
                            "w-10 shrink-0 border-r",
                            date.getDay() === 0 ? "bg-red-50" : date.getDay() === 6 ? "bg-blue-50" : "",
                            isMonthStart ? "border-l-2 border-l-blue-300" : "",
                            isToday ? "bg-yellow-50" : "",
                            isOpenDay ? "bg-yellow-200 bg-opacity-50" : "",
                          )}
                        />
                      )
                    })}
                  </div>
                </div>

                {groupTasks.map(
                  (
                    task: Task, // Task型を使用
                  ) => (
                    <div key={task.id} className="flex relative">
                      <div
                        className="w-80 shrink-0 border-r border-b px-4 py-2 flex items-center justify-between sticky left-0 bg-white z-20 hover:bg-slate-50 transition-colors group"
                        onDoubleClick={() => openEditDialog(task)}
                      >
                        <div className="flex items-center space-x-2 w-full">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{task.name}</span>
                              <span className="text-xs text-blue-600 whitespace-nowrap">
                                {formatDuration(task.startDate, task.endDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center flex-shrink-0">
                            {task.memo && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="mr-1 text-slate-400 hover:text-slate-700">
                                    <Info className="h-3.5 w-3.5" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">メモ</h4>
                                    <p className="text-sm text-slate-600">{task.memo}</p>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700"
                              onClick={() => openEditDialog(task)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-b relative h-10">
                        {dateRange.map((date, index) => {
                          const isMonthStart = isFirstDayOfMonth(date)
                          const isToday = isSameDay(date, today)
                          const isOpenDay = openDate && isSameDay(date, openDate)

                          return (
                            <div
                              key={index}
                              className={cn(
                                "w-10 shrink-0 border-r",
                                date.getDay() === 0 ? "bg-red-50" : date.getDay() === 6 ? "bg-blue-50" : "",
                                isMonthStart ? "border-l-2 border-l-blue-300" : "",
                                isToday ? "bg-yellow-50" : "",
                                isOpenDay ? "bg-yellow-200 bg-opacity-50" : "",
                              )}
                            />
                          )
                        })}

                        {/* タスクバー */}
                        <div
                          className="rounded-md flex items-center justify-center text-xs text-white font-medium px-2 overflow-hidden cursor-move relative"
                          style={getTaskStyle(task)}
                          onMouseDown={(e) => handleDragStart(e, task, "move")}
                          onDoubleClick={() => openEditDialog(task)}
                          onMouseEnter={(e) => handleMouseEnter(e, task)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <span className="truncate">{task.name}</span>

                          {/* リサイズハンドル */}
                          <div
                            className="absolute left-0 w-1.5 h-full bg-black/20 cursor-ew-resize hover:bg-black/30 transition-colors"
                            onMouseDown={(e) => handleDragStart(e, task, "resize-start")}
                          />
                          <div
                            className="absolute right-0 w-1.5 h-full bg-black/20 cursor-ew-resize hover:bg-black/30 transition-colors"
                            onMouseDown={(e) => handleDragStart(e, task, "resize-end")}
                          />
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ),
          )}
        </div>
      </div>

      {/* ホバーツールチップ */}
      {hoveredTask && hoveredTaskId && (
        <div
          className="fixed bg-white border border-gray-300 rounded-xl shadow-2xl p-5 max-w-[500px] z-[9999] pointer-events-auto"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 20}px`,
            transform: "translateY(-100%)",
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          <div className="text-gray-800 space-y-4">
            {/* タスクヘッダー */}
            <div className="border-b border-gray-200 pb-3">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{hoveredTask.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                  {format(new Date(hoveredTask.startDate), "yyyy/MM/dd", { locale: ja })} 〜{" "}
                  {format(new Date(hoveredTask.endDate), "yyyy/MM/dd", { locale: ja })}
                </span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                  {formatDuration(hoveredTask.startDate, hoveredTask.endDate)}
                </span>
              </div>
              {openDate && (
                <div className="mt-2 text-sm text-amber-600 font-medium">
                  開始: {getDaysFromOpenDate(new Date(hoveredTask.startDate))} / 終了:{" "}
                  {getDaysFromOpenDate(new Date(hoveredTask.endDate))}
                </div>
              )}
            </div>

            {/* メモ表示 */}
            {hoveredTask.memo && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1 text-blue-500" />
                  メモ
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{hoveredTask.memo}</p>
              </div>
            )}

            {/* サブタスク表示 */}
            {hoveredTask.subTasks && hoveredTask.subTasks.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-blue-700">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  サブタスク
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {hoveredTask.subTasks.map(
                    (
                      category: SubTaskCategory, // SubTaskCategory型を使用
                    ) => (
                      <div key={category.id} className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-medium text-gray-900 mb-2 text-blue-600 text-sm">{category.name}</h5>
                        <div className="space-y-2">
                          {category.items.map((item: any) => (
                            <div key={item.id} className="flex items-start space-x-3">
                              <div
                                className={`w-4 h-4 mt-0.5 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${
                                  item.completed ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                                }`}
                              >
                                {item.completed && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={`text-xs leading-relaxed ${
                                  item.completed ? "line-through text-gray-500" : "text-gray-700"
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* 進捗表示 */}
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                            <span>進捗</span>
                            <span>
                              {Math.round(
                                (category.items.filter((item: any) => item.completed).length / category.items.length) *
                                  100,
                              )}
                              %
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(category.items.filter((item: any) => item.completed).length / category.items.length) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* 全体進捗（サブタスクがある場合） */}
            {hoveredTask.subTasks && hoveredTask.subTasks.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 border-t border-blue-200">
                <div className="flex justify-between items-center text-sm font-medium text-blue-800 mb-2">
                  <span>全体進捗</span>
                  <span>
                    {Math.round(
                      (hoveredTask.subTasks.reduce(
                        (acc: number, cat: SubTaskCategory) =>
                          acc + cat.items.filter((item: any) => item.completed).length,
                        0,
                      ) /
                        hoveredTask.subTasks.reduce((acc: number, cat: SubTaskCategory) => acc + cat.items.length, 0)) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (hoveredTask.subTasks.reduce(
                          (acc: number, cat: SubTaskCategory) =>
                            acc + cat.items.filter((item: any) => item.completed).length,
                          0,
                        ) /
                          hoveredTask.subTasks.reduce(
                            (acc: number, cat: SubTaskCategory) => acc + cat.items.length,
                            0,
                          )) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* ツールチップの矢印 */}
          <div className="absolute top-full left-8 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white drop-shadow-sm"></div>
        </div>
      )}

      {/* タスク編集ダイアログ */}
      {editingTask && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">タスクを編集</DialogTitle>
              <DialogDescription>タスクの詳細を編集してください。</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-3">
                <Label htmlFor="edit-name" className="text-base font-medium">
                  タスク名
                </Label>
                <Input
                  id="edit-name"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  className="border-slate-300 text-base"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label className="text-base font-medium">開始日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("justify-start text-left font-normal border-slate-300 h-11")}
                      >
                        {format(new Date(editingTask.startDate), "yyyy年MM月dd日", { locale: ja })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={new Date(editingTask.startDate)}
                        onSelect={(date) => date && setEditingTask({ ...editingTask, startDate: date.getTime() })} // getTime()を追加
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                  {openDate && (
                    <p className="text-sm text-slate-500">{getDaysFromOpenDate(new Date(editingTask.startDate))}</p>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label className="text-base font-medium">終了日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("justify-start text-left font-normal border-slate-300 h-11")}
                      >
                        {format(new Date(editingTask.endDate), "yyyy年MM月dd日", { locale: ja })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={new Date(editingTask.endDate)}
                        onSelect={(date) => date && setEditingTask({ ...editingTask, endDate: date.getTime() })} // getTime()を追加
                        locale={ja}
                      />
                    </PopoverContent>
                  </Popover>
                  {openDate && (
                    <p className="text-sm text-slate-500">{getDaysFromOpenDate(new Date(editingTask.endDate))}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="edit-category" className="text-base font-medium">
                    {" "}
                    {/* groupからcategoryに変更 */}
                    カテゴリ
                  </Label>
                  <Select
                    value={editingTask.category}
                    onValueChange={(value) => setEditingTask({ ...editingTask, category: value })}
                  >
                    <SelectTrigger className="border-slate-300 h-11">
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="マイルストーン">マイルストーン</SelectItem>
                      <SelectItem value="洗車場開発">洗車場開発</SelectItem>
                      <SelectItem value="バックオフィス">バックオフィス</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="edit-color" className="text-base font-medium">
                    色
                  </Label>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full ${editingTask.color === "#ff9900" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#ff9900" }}
                      onClick={() => setEditingTask({ ...editingTask, color: "#ff9900" })}
                    />
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full ${editingTask.color === "#3b82f6" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#3b82f6" }}
                      onClick={() => setEditingTask({ ...editingTask, color: "#3b82f6" })}
                    />
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full ${editingTask.color === "#8b5cf6" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#8b5cf6" }}
                      onClick={() => setEditingTask({ ...editingTask, color: "#8b5cf6" })}
                    />
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full ${editingTask.color === "#f97316" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#f97316" }}
                      onClick={() => setEditingTask({ ...editingTask, color: "#f97316" })}
                    />
                    <button
                      type="button"
                      className={`w-10 h-10 rounded-full ${editingTask.color === "#ef4444" ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: "#ef4444" }}
                      onClick={() => setEditingTask({ ...editingTask, color: "#ef4444" })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="edit-memo" className="text-base font-medium">
                  メモ
                </Label>
                <Textarea
                  id="edit-memo"
                  value={editingTask.memo || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, memo: e.target.value })}
                  placeholder="タスクに関するメモを入力してください"
                  className="border-slate-300 min-h-[120px] text-base"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is-hidden"
                  checked={editingTask.isHidden}
                  onCheckedChange={(checked) => setEditingTask({ ...editingTask, isHidden: Boolean(checked) })}
                />
                <label htmlFor="edit-is-hidden" className="text-base font-medium leading-none">
                  パートナー企業向けに非表示にする
                </label>
              </div>

              {/* サブタスクセクション */}
              {editingTask.subTasks && editingTask.subTasks.length > 0 && (
                <div className="grid gap-3">
                  <Label className="text-lg font-semibold text-blue-700">サブタスク</Label>
                  <div className="border border-slate-200 rounded-lg p-6 max-h-96 overflow-y-auto bg-slate-50">
                    {editingTask.subTasks.map(
                      (
                        category: SubTaskCategory,
                        categoryIndex: number, // SubTaskCategory型を使用
                      ) => (
                        <div key={category.id} className="mb-6 last:mb-0">
                          <h4 className="font-semibold text-lg text-slate-800 mb-4 text-blue-600 border-b-2 border-blue-200 pb-2">
                            {category.name}
                          </h4>
                          <div className="space-y-3 ml-4">
                            {category.items.map((item: any, itemIndex: number) => (
                              <div
                                key={item.id}
                                className="flex items-center space-x-4 p-3 hover:bg-white rounded-lg transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  id={`subtask-${item.id}`}
                                  checked={item.completed}
                                  onChange={(e) => {
                                    const updatedTask = { ...editingTask }
                                    updatedTask.subTasks[categoryIndex].items[itemIndex].completed = e.target.checked
                                    setEditingTask(updatedTask)
                                  }}
                                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <label
                                  htmlFor={`subtask-${item.id}`}
                                  className={`text-base cursor-pointer flex-1 ${
                                    item.completed ? "line-through text-gray-500" : "text-gray-700"
                                  }`}
                                >
                                  {item.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between pt-6">
              <Button
                variant="destructive"
                onClick={handleDeleteTask}
                className="bg-red-500 hover:bg-red-600 flex items-center gap-2 px-6 py-2"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-slate-300 px-6 py-2"
                >
                  キャンセル
                </Button>
                <Button onClick={handleUpdateTask} className="bg-blue-600 hover:bg-blue-700 px-6 py-2">
                  更新
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
