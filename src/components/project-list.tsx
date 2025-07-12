"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { PlusCircle, Calendar, ArrowRight, Trash2, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useProjectStore } from "@/lib/project-store"
import { Badge } from "@/components/ui/badge"

// OPEN日までの日数を計算する関数
const getDaysUntilOpen = (openDate: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = Math.abs(openDate.getTime() - today.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function ProjectList() {
  const router = useRouter()
  const { toast } = useToast()
  const { projects, addProject, deleteProject } = useProjectStore()

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<any>(null)

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "エラー",
        description: "プロジェクト名を入力してください",
        variant: "destructive",
      })
      return
    }

    const newProjectId = addProject(newProjectName)
    setNewProjectName("")
    setIsNewDialogOpen(false)

    toast({
      title: "プロジェクト作成完了",
      description: `「${newProjectName}」を作成しました`,
    })

    // 新しいプロジェクトページに遷移
    router.push(`/projects/${newProjectId}`)
  }

  const handleDeleteProject = () => {
    if (!projectToDelete) return

    deleteProject(projectToDelete.id)
    setProjectToDelete(null)
    setIsDeleteDialogOpen(false)

    toast({
      title: "プロジェクト削除完了",
      description: `「${projectToDelete.name}」を削除しました`,
    })
  }

  const confirmDeleteProject = (project: any) => {
    setProjectToDelete(project)
    setIsDeleteDialogOpen(true)
  }

  const openProject = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 新規プロジェクト作成カード */}
        <Card className="border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors">
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
              <CardContent className="p-6 flex flex-col items-center justify-center h-full cursor-pointer">
                <PlusCircle className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-slate-700">新規プロジェクト作成</h3>
                <p className="text-sm text-slate-500 mt-2 text-center">新しい洗車場開発プロジェクトを作成します</p>
              </CardContent>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規プロジェクト作成</DialogTitle>
                <DialogDescription>新しいプロジェクトの名前を入力してください。</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="プロジェクト名"
                  className="border-slate-300"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateProject} className="bg-blue-600 hover:bg-blue-700">
                  作成
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>

        {/* 既存プロジェクト一覧 */}
        {projects.map((project, index) => (
          <Card
            key={project.id}
            className="border-slate-200 hover:border-blue-200 transition-colors hover-scale animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-800">{project.name}</CardTitle>
              <CardDescription className="flex items-center">
                作成日: {format(new Date(project.createdAt), "yyyy年MM月dd日", { locale: ja })}
                {project.updatedAt && project.updatedAt !== project.createdAt && (
                  <span className="ml-2 text-xs text-slate-400 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    更新: {format(new Date(project.updatedAt), "yyyy/MM/dd HH:mm", { locale: ja })}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              {project.openDate ? (
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    OPEN日: {format(new Date(project.openDate), "yyyy年MM月dd日", { locale: ja })}
                  </div>
                  <Badge variant="success" animation="pulse" className="text-xs font-medium">
                    OPENまであと{getDaysUntilOpen(new Date(project.openDate))}日！
                  </Badge>
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">OPEN日未設定</div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                onClick={() => confirmDeleteProject(project)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => openProject(project.id)}>
                開く
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>プロジェクトがまだありません。「新規プロジェクト作成」から作成してください。</p>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>プロジェクト削除の確認</DialogTitle>
            <DialogDescription>
              {projectToDelete && `「${projectToDelete.name}」を削除します。この操作は元に戻せません。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
