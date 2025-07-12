"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, Save } from "lucide-react" // CheckCircle2 は不要になったため削除

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useTaskStore } from "@/lib/task-store"
import { useProjectStore } from "@/lib/project-store"
import type { TaskStatus } from "@/lib/task-store"

type SettingsPanelProps = {}

export function SettingsPanel({}: SettingsPanelProps) {
  const { currentProject, updateProjectOpenDate, updateProjectUseWellWater } = useProjectStore()
  const { addTask, deleteAllTasksForProject } = useTaskStore()
  const { toast } = useToast()

  const [openDate, setOpenDate] = useState<Date | undefined>(
    currentProject?.openDate ? new Date(currentProject.openDate) : undefined,
  )
  const [useWellWater, setUseWellWater] = useState(currentProject?.useWellWater || false)

  // currentProjectが変更されたらローカルの状態を更新
  useEffect(() => {
    if (currentProject) {
      setOpenDate(currentProject.openDate ? new Date(currentProject.openDate) : undefined)
      setUseWellWater(currentProject.useWellWater)
    }
  }, [currentProject])

  const handleSaveSettings = async () => {
    if (currentProject) {
      await updateProjectOpenDate(currentProject.id, openDate || new Date()) // openDateがundefinedの場合のデフォルト値
      await updateProjectUseWellWater(currentProject.id, useWellWater)
      toast({
        title: "設定保存完了",
        description: "プロジェクト設定が更新されました。",
      })
    }
  }

  const generateSchedule = async () => {
    if (!currentProject || !openDate) {
      toast({
        title: "エラー",
        description: "プロジェクトのOPEN日を設定してください。",
        variant: "destructive",
      })
      return
    }

    // 既存のタスクを全て削除
    await deleteAllTasksForProject(currentProject.id) // 非同期処理を待つ

    const tasksToGenerate = [
      {
        name: "工事請負/洗車機販売契約",
        category: "バックオフィス",
        duration: 10,
        offsetDays: -120, // OPEN日の約4ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "各種請求 (1回目)",
        category: "バックオフィス",
        duration: 10,
        offsetDays: -115, // OPEN日の約4ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "洗車機発注",
        category: "バックオフィス",
        duration: 10,
        offsetDays: -115, // OPEN日の約4ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "地鎮祭",
        category: "洗車場開発",
        duration: 4,
        offsetDays: -105, // OPEN日の約3.5ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "CUB/Comp手配",
        category: "洗車場開発",
        duration: 4,
        offsetDays: -100, // OPEN日の約3.5ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      ...(useWellWater
        ? [
            {
              name: "井戸工事",
              category: "洗車場開発",
              duration: 15,
              offsetDays: -100, // OPEN日の約3.5ヶ月前
              status: "未着手" as TaskStatus,
              subTasks: [],
            },
          ]
        : []),
      {
        name: "洗車場土木関連工事",
        category: "洗車場開発",
        duration: 70,
        offsetDays: -90, // OPEN日の約3ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "ハイロックグッズ既存",
        category: "バックオフィス",
        duration: 30,
        offsetDays: -60, // OPEN日の約2ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [
          {
            id: "aluminum-boards",
            name: "①アルミ合板系",
            items: [
              { id: "price-board", name: "料金表（4コース or 2コース）", completed: false },
              { id: "terms-board", name: "利用規約看板", completed: false },
              { id: "exit-signal", name: "出口信号看板", completed: false },
              { id: "towel-board", name: "タオル分別ボード", completed: false },
            ],
          },
          {
            id: "goods",
            name: "②グッズ",
            items: [
              { id: "subscription-card", name: "サブスクカード　2500枚", completed: false },
              { id: "subscription-sticker", name: "サブスクカードのシール　1500,500,500,200", completed: false },
              { id: "subscription-flyer", name: "サブスクフライヤー　1000枚", completed: false },
              { id: "point-card", name: "ポイントカード　2000枚", completed: false },
              { id: "terms-paper", name: "利用規約　2500枚", completed: false },
              { id: "mat-cleaner-sticker", name: "マットクリーナーステッカー", completed: false },
            ],
          },
          {
            id: "variable-elements",
            name: "③その他可変要素",
            items: [
              { id: "area-map", name: "区画図", completed: false },
              { id: "machine-wrapping", name: "洗車機ラッピング", completed: false },
              { id: "point-card-color", name: "ポイントカード（及び各店舗カラーアイコン）　2,000枚", completed: false },
              { id: "instruction-signs", name: "指示看板等", completed: false },
              { id: "staff-room-film", name: "スタッフルーム入口フィルム", completed: false },
              { id: "hp-change", name: "HP変更", completed: false },
              { id: "special-flyer", name: "３９専用サブスクフライヤー", completed: false },
              { id: "apparel", name: "アパレル（Tシャツ、パーカー、ベンチコート）", completed: false },
              { id: "nobori", name: "のぼり", completed: false },
            ],
          },
        ],
      },
      {
        name: "ハイロックグッズ新規",
        category: "バックオフィス",
        duration: 30,
        offsetDays: -60, // OPEN日の約2ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [
          {
            id: "new-signage",
            name: "新規制作物",
            items: [
              { id: "signboard", name: "看板", completed: false },
              { id: "banner", name: "横断幕", completed: false },
            ],
          },
        ],
      },
      {
        name: "プロモーション戦略",
        category: "バックオフィス",
        duration: 30,
        offsetDays: -60, // OPEN日の約2ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [
          {
            id: "campaign-planning",
            name: "キャンペーン企画",
            items: [
              { id: "campaign-content", name: "キャンペーン内容", completed: false },
              { id: "store-name-decision", name: "店舗名確定", completed: false },
            ],
          },
          {
            id: "teaser-campaign",
            name: "①ティザー",
            items: [
              { id: "teaser-design", name: "デザイン", completed: false },
              { id: "teaser-confirm", name: "確定", completed: false },
              { id: "teaser-order", name: "発注", completed: false },
              { id: "teaser-display", name: "掲示", completed: false },
            ],
          },
          {
            id: "flyer-campaign",
            name: "②チラシ",
            items: [
              { id: "flyer-design", name: "デザイン", completed: false },
              { id: "flyer-confirm", name: "確定", completed: false },
              { id: "flyer-print", name: "印刷", completed: false },
              { id: "flyer-distribute", name: "配布", completed: false },
            ],
          },
          {
            id: "sns-influencer",
            name: "③SNSインフルエンサー",
            items: [
              { id: "influencer-selection", name: "選定", completed: false },
              { id: "influencer-shooting", name: "撮影", completed: false },
              { id: "influencer-broadcast", name: "配信", completed: false },
            ],
          },
          {
            id: "other-promotion",
            name: "④その他",
            items: [
              { id: "media-release-day", name: "メディア解放日兼撮影日", completed: false },
              { id: "cm-shooting-day", name: "CM撮影日", completed: false },
            ],
          },
        ],
      },
      {
        name: "求人系",
        category: "バックオフィス",
        duration: 40,
        offsetDays: -60, // OPEN日の約2ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [
          {
            id: "recruitment-process",
            name: "求人活動",
            items: [
              { id: "indeed-marketing", name: "インディード集客開始", completed: false },
              { id: "interview", name: "面談", completed: false },
              { id: "hiring", name: "採用", completed: false },
            ],
          },
        ],
      },
      {
        name: "洗車機搬入@伊佐建設",
        category: "洗車場開発",
        duration: 4,
        offsetDays: -45, // OPEN日の約1.5ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "通信系",
        category: "バックオフィス",
        duration: 30,
        offsetDays: -50, // OPEN日の約1.5ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [
          {
            id: "contract-procedures",
            name: "契約/手続き項目",
            items: [
              { id: "phone-dialpad", name: "電話開通（ダイアルパッド等）", completed: false },
              { id: "office-wifi", name: "事務所内wifi", completed: false },
              { id: "google-setup", name: "Google関連手配", completed: false },
              { id: "google-map", name: "googlemap作成", completed: false },
              { id: "sns-creation", name: "SNS作成", completed: false },
              { id: "airshift", name: "エアシフト", completed: false },
            ],
          },
        ],
      },
      {
        name: "ガラス屋手配",
        category: "洗車場開発",
        duration: 4,
        offsetDays: -40, // OPEN日の約1.5ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "洗車機搬入@候補地",
        category: "洗車場開発",
        duration: 4,
        offsetDays: -24, // OPEN日の約3週間前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "各種請求 (2回目)",
        category: "バックオフィス",
        duration: 7,
        offsetDays: -24, // 洗車機搬入@候補地の開始日と同じ
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "洗車機設営",
        category: "洗車場開発",
        duration: 20,
        offsetDays: -21, // OPEN日の約3週間前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "運営備品手配",
        category: "洗車場開発",
        duration: 20,
        offsetDays: -21, // OPEN日の約3週間前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "ガラスIN",
        category: "洗車場開発",
        duration: 5,
        offsetDays: -11, // OPEN日の約10日前
        status: "未着手" as TaskStatus,
        subTasks: [],
      },
      {
        name: "現場研修",
        category: "バックオフィス",
        duration: 30,
        offsetDays: -51, // 洗車機設営の開始日前日から1ヶ月前
        status: "未着手" as TaskStatus,
        subTasks: [
          {
            id: "training-process",
            name: "研修プロセス",
            items: [
              { id: "internal-selection", name: "社内選定（or幹部採用）", completed: false },
              { id: "pre-training-theory", name: "事前研修座学", completed: false },
              { id: "pre-training-practice", name: "事前研修店舗留学", completed: false },
            ],
          },
        ],
      },
      {
        name: "OPEN日",
        category: "マイルストーン",
        duration: 1,
        offsetDays: 0,
        status: "未着手" as TaskStatus,
        subTasks: [],
        isHidden: true, // OPEN日タスクを非表示にする
      },
    ]

    const addPromises = tasksToGenerate.map(async (taskData) => {
      const startDate = new Date(openDate)
      startDate.setDate(openDate.getDate() + taskData.offsetDays)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + taskData.duration - 1)

      await addTask(currentProject.id, {
        name: taskData.name,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        duration: taskData.duration,
        progress: 0,
        status: taskData.status,
        dependencies: [],
        category: taskData.category,
        subTasks: taskData.subTasks,
        isHidden: taskData.isHidden || false, // isHiddenを考慮
      })
    })

    await Promise.all(addPromises) // すべてのタスク追加が完了するのを待つ

    toast({
      title: "スケジュール生成完了",
      description: "デフォルトのスケジュールが生成されました。",
    })
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-slate-700">
            <CalendarIcon className="h-4 w-4 text-blue-500" />
            OPEN日
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal border-slate-300 hover:bg-slate-50 transition-colors",
                  !openDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                {openDate ? format(openDate, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={openDate} onSelect={setOpenDate} locale={ja} />
            </PopoverContent>
          </Popover>
        </div>

        {/* 井戸水使用のレイアウトを修正 */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="well-water"
            checked={useWellWater}
            onCheckedChange={(checked) => {
              setUseWellWater(checked === true)
            }}
            className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <label
            htmlFor="well-water"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700"
          >
            井戸水使用
          </label>
        </div>
      </div>
      <Button
        onClick={handleSaveSettings}
        className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-md"
        disabled={!currentProject}
      >
        <Save className="h-4 w-4 mr-2" />
        設定を保存
      </Button>
      <Button
        onClick={generateSchedule}
        variant="outline"
        className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
        disabled={!currentProject || !openDate}
      >
        デフォルトスケジュール生成
      </Button>
    </div>
  )
}
