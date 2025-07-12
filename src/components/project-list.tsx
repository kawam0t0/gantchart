"use client"

import { useRouter } from "next/navigation"
import { useProjectStore } from "@/lib/project-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { ArrowRight, Trash2, Calendar, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ProjectList() {
  const { projects, deleteProject } = useProjectStore()
  const router = useRouter()
  const { toast } = useToast()

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (window.confirm(`プロジェクト「${projectName}」を本当に削除しますか？`)) {
      await deleteProject(projectId) // 非同期処理を待つ
      toast({
        title: "プロジェクト削除完了",
        description: `プロジェクト「${projectName}」を削除しました。`,
      })
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.length === 0 ? (
        <p className="col-span-full text-center text-slate-500">まだプロジェクトがありません。新規作成してください。</p>
      ) : (
        projects.map((project) => (
          <Card
            key={project.id}
            className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-800 truncate">{project.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-slate-600">
                <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                <span>
                  OPEN日:{" "}
                  {project.openDate ? format(new Date(project.openDate), "yyyy年MM月dd日", { locale: ja }) : "未設定"}
                </span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                <span>井戸水利用: {project.useWellWater ? "はい" : "いいえ"}</span>
              </div>
            </CardContent>
            <div className="p-4 border-t flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/projects/${project.id}`)}
                className="flex items-center space-x-2 text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <span>開く</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteProject(project.id, project.name)}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span>削除</span>
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
