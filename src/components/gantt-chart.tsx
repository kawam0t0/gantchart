"use client"

import { useState } from "react"
import { useTaskStore, type Task } from "@/lib/task-store"
import { useProjectStore } from "@/lib/project-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, CalendarIcon, Eye, EyeOff, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns"
import { ja } from "date-fns/locale"

const CATEGORIES = [
  { value: "洗車場開発", label: "洗車場開発", color: "bg-orange-500" },
  { value: "バックオフィス", label: "バックオフィス", color: "bg-blue-500" },
  { value: "OPEN日", label: "OPEN日", color: "bg-red-500" },
]

const TASK_STATUSES = [
  { value: "未着手", label: "未着手" },
  { value: "進行中", label: "進行中" },
  { value: "完了", label: "完了" },
  { value: "遅延", label: "遅延" },
]

export function GanttChart() {
  const { currentProject } = useProjectStore()
  const { tasks, addTask, updateTask, deleteTask, updateSubTaskItem, toggleTaskVisibility } = useTaskStore()

  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [showHiddenTasks, setShowHiddenTasks] = useState(false)

  const [newTask, setNewTask] = useState({
    name: "",
    startDate: new Date(),
    endDate: new Date(),
    category: "バックオフィス",
    subTasks: [] as any[],
  })

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Filter tasks based on visibility settings
  const visibleTasks = tasks.filter((task) => {
    if (task.category === "OPEN日") return false // Always hide OPEN日 tasks
    if (task.isHidden && !showHiddenTasks) return false
    return true
  })

  // Group tasks by category
  const tasksByCategory = visibleTasks.reduce(
    (acc, task) => {
      if (!acc[task.category]) acc[task.category] = []
      acc[task.category].push(task)
      return acc
    },
    {} as Record<string, Task[]>,
  )

  const getCategoryColor = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category)
    return cat?.color || "bg-gray-500"
  }

  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)

    const totalDays = weekDays.length
    const startIndex = weekDays.findIndex((day) => isSameDay(day, taskStart))
    const endIndex = weekDays.findIndex((day) => isSameDay(day, taskEnd))

    if (startIndex === -1 && endIndex === -1) {
      // Task is completely outside the current week
      if (taskEnd < weekStart) return null // Task is before current week
      if (taskStart > weekEnd) return null // Task is after current week

      // Task spans the entire week
      return { left: 0, width: 100 }
    }

    const actualStart = Math.max(0, startIndex)
    const actualEnd = Math.min(totalDays - 1, endIndex === -1 ? totalDays - 1 : endIndex)

    const left = (actualStart / totalDays) * 100
    const width = ((actualEnd - actualStart + 1) / totalDays) * 100

    return { left, width }
  }

  const handleAddTask = async () => {
    if (!currentProject || !newTask.name.trim()) return

    await addTask(currentProject.id, {
      name: newTask.name,
      startDate: newTask.startDate.getTime(),
      endDate: newTask.endDate.getTime(),
      category: newTask.category,
      dependencies: [],
      subTasks: newTask.subTasks,
    })

    setNewTask({
      name: "",
      startDate: new Date(),
      endDate: new Date(),
      category: "バックオフィス",
      subTasks: [],
    })
    setShowAddDialog(false)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowEditDialog(true)
  }

  const handleUpdateTask = async () => {
    if (!currentProject || !editingTask) return

    await updateTask(currentProject.id, editingTask.id, {
      name: editingTask.name,
      startDate: editingTask.startDate,
      endDate: editingTask.endDate,
      category: editingTask.category,
      status: editingTask.status,
      progress: editingTask.progress,
      subTasks: editingTask.subTasks,
    })

    setEditingTask(null)
    setShowEditDialog(false)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!currentProject) return
    if (confirm("このタスクを削除しますか？")) {
      await deleteTask(currentProject.id, taskId)
    }
  }

  const handleToggleTaskVisibility = async (taskId: string, isHidden: boolean) => {
    if (!currentProject) return
    await toggleTaskVisibility(currentProject.id, taskId, isHidden)
  }

  const handleSubTaskToggle = async (taskId: string, categoryId: string, itemId: string, completed: boolean) => {
    if (!currentProject) return
    await updateSubTaskItem(currentProject.id, taskId, categoryId, itemId, completed)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">ガントチャート</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {format(weekStart, "yyyy年MM月dd日", { locale: ja })} - {format(weekEnd, "MM月dd日", { locale: ja })}
            </span>
            <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowHiddenTasks(!showHiddenTasks)}>
            {showHiddenTasks ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            非表示タスクを表示
          </Button>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>タスク追加</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新しいタスクを追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="task-name">タスク名</Label>
                  <Input
                    id="task-name"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="タスク名を入力"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>開始日</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newTask.startDate, "yyyy/MM/dd")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newTask.startDate}
                          onSelect={(date) => date && setNewTask({ ...newTask, startDate: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>終了日</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newTask.endDate, "yyyy/MM/dd")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newTask.endDate}
                          onSelect={(date) => date && setNewTask({ ...newTask, endDate: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label>カテゴリ</Label>
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => setNewTask({ ...newTask, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleAddTask}>追加</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="bg-white rounded-lg border">
        <div className="grid grid-cols-[200px_1fr] border-b">
          <div className="p-3 font-medium border-r">タスク名</div>
          <div className="grid grid-cols-7 text-center text-sm">
            {weekDays.map((day, index) => (
              <div key={index} className="p-2 border-r last:border-r-0">
                <div className="font-medium">{format(day, "MM/dd", { locale: ja })}</div>
                <div className="text-xs text-gray-500">{format(day, "E", { locale: ja })}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by Category */}
        {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
          <div key={category}>
            {/* Category Header */}
            <div className="grid grid-cols-[200px_1fr] border-b bg-gray-50">
              <div className="p-2 font-medium text-sm border-r flex items-center">
                <div className={`w-3 h-3 rounded mr-2 ${getCategoryColor(category)}`}></div>
                {category}
              </div>
              <div className="p-2"></div>
            </div>

            {/* Category Tasks */}
            {categoryTasks.map((task) => {
              const position = getTaskPosition(task)
              if (!position) return null

              return (
                <div key={task.id} className="grid grid-cols-[200px_1fr] border-b hover:bg-gray-50 group">
                  <div className="p-3 border-r flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{task.name}</span>
                      {task.isHidden && (
                        <Badge variant="secondary" className="text-xs">
                          非表示
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleTaskVisibility(task.id, !task.isHidden)}
                      >
                        {task.isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEditTask(task)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="relative p-2">
                    <div
                      className={`h-6 rounded ${getCategoryColor(task.category)} opacity-80 cursor-pointer relative`}
                      style={{
                        left: `${position.left}%`,
                        width: `${position.width}%`,
                      }}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                      onClick={() => handleEditTask(task)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                        {task.progress > 0 && `${task.progress}%`}
                      </div>

                      {/* Progress bar */}
                      {task.progress > 0 && (
                        <div
                          className="absolute top-0 left-0 h-full bg-white bg-opacity-30 rounded"
                          style={{ width: `${task.progress}%` }}
                        />
                      )}
                    </div>

                    {/* Hover tooltip */}
                    {hoveredTask === task.id && task.subTasks && task.subTasks.length > 0 && (
                      <div className="absolute z-10 bg-white border rounded-lg shadow-lg p-3 mt-2 min-w-[300px]">
                        <div className="font-medium mb-2">{task.name}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {format(new Date(task.startDate), "yyyy/MM/dd")} -{" "}
                          {format(new Date(task.endDate), "yyyy/MM/dd")}
                        </div>
                        {task.subTasks.map((category) => (
                          <div key={category.id} className="mb-2">
                            <div className="font-medium text-sm">{category.name}</div>
                            <div className="space-y-1">
                              {category.items.map((item) => (
                                <div key={item.id} className="flex items-center space-x-2 text-sm">
                                  <Checkbox
                                    checked={item.completed}
                                    onCheckedChange={(checked) =>
                                      handleSubTaskToggle(task.id, category.id, item.id, checked as boolean)
                                    }
                                  />
                                  <span className={item.completed ? "line-through text-gray-500" : ""}>
                                    {item.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>タスクを編集</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-task-name">タスク名</Label>
                <Input
                  id="edit-task-name"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>開始日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(new Date(editingTask.startDate), "yyyy/MM/dd")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(editingTask.startDate)}
                        onSelect={(date) => date && setEditingTask({ ...editingTask, startDate: date.getTime() })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>終了日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(new Date(editingTask.endDate), "yyyy/MM/dd")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(editingTask.endDate)}
                        onSelect={(date) => date && setEditingTask({ ...editingTask, endDate: date.getTime() })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>カテゴリ</Label>
                  <Select
                    value={editingTask.category}
                    onValueChange={(value) => setEditingTask({ ...editingTask, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>ステータス</Label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(value) => setEditingTask({ ...editingTask, status: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="progress">進捗 (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={editingTask.progress}
                  onChange={(e) => setEditingTask({ ...editingTask, progress: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Sub-tasks */}
              {editingTask.subTasks && editingTask.subTasks.length > 0 && (
                <div>
                  <Label>サブタスク</Label>
                  <div className="space-y-3 mt-2">
                    {editingTask.subTasks.map((category) => (
                      <div key={category.id} className="border rounded p-3">
                        <div className="font-medium mb-2">{category.name}</div>
                        <div className="space-y-2">
                          {category.items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={item.completed}
                                onCheckedChange={(checked) => {
                                  const updatedSubTasks = editingTask.subTasks?.map((cat) =>
                                    cat.id === category.id
                                      ? {
                                          ...cat,
                                          items: cat.items.map((itm) =>
                                            itm.id === item.id ? { ...itm, completed: checked as boolean } : itm,
                                          ),
                                        }
                                      : cat,
                                  )
                                  setEditingTask({ ...editingTask, subTasks: updatedSubTasks })
                                }}
                              />
                              <span className={item.completed ? "line-through text-gray-500" : ""}>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleUpdateTask}>更新</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
