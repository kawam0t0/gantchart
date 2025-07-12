"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CalendarIcon, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useTaskStore } from "@/lib/task-store"
import { useProjectStore } from "@/lib/project-store"

export function SettingsPanel() {
  const { toast } = useToast()
  const [date, setDate] = useState<Date>()
  const [isWellWaterUsed, setIsWellWaterUsed] = useState(false)
  const { setTasks } = useTaskStore()
  const { currentProjectId, currentProject, updateProjectOpenDate } = useProjectStore()

  // 前回のOPEN日を保存するためのref
  const previousOpenDateRef = useRef<Date | null>(null)

  useEffect(() => {
    if (currentProject?.openDate) {
      const newOpenDate = new Date(currentProject.openDate)
      setDate(newOpenDate)

      // 前回のOPEN日が存在し、かつ現在のタスクが存在する場合、タスクの日付を調整
      if (previousOpenDateRef.current && useTaskStore.getState().tasks.length > 0) {
        adjustTaskDates(previousOpenDateRef.current, newOpenDate)
      }

      // 現在のOPEN日を保存
      previousOpenDateRef.current = newOpenDate
    } else {
      setDate(undefined)
      previousOpenDateRef.current = null
    }
  }, [currentProject])

  // OPEN日が変更された時にタスクの日付を調整する関数
  const adjustTaskDates = (oldOpenDate: Date, newOpenDate: Date) => {
    const { tasks, setTasks } = useTaskStore.getState()

    if (tasks.length === 0) return

    // 日付の差分を計算（ミリ秒）
    const dateDiff = newOpenDate.getTime() - oldOpenDate.getTime()

    // すべてのタスクの日付を調整
    const adjustedTasks = tasks.map((task) => {
      const startDate = new Date(task.startDate)
      const endDate = new Date(task.endDate)

      // 日付を調整
      startDate.setTime(startDate.getTime() + dateDiff)
      endDate.setTime(endDate.getTime() + dateDiff)

      return {
        ...task,
        startDate,
        endDate,
      }
    })

    // 調整されたタスクを保存
    setTasks(adjustedTasks)

    toast({
      title: "スケジュール更新",
      description: `OPEN日の変更に合わせてスケジュールを調整しました`,
    })
  }

  const generateSchedule = () => {
    if (!date) {
      toast({
        title: "エラー",
        description: "OPEN日を選択してください",
        variant: "destructive",
      })
      return
    }

    if (!currentProjectId) {
      toast({
        title: "エラー",
        description: "プロジェクトを選択または作成してください",
        variant: "destructive",
      })
      return
    }

    // OPEN日を基準に日付を計算
    const openDate = new Date(date)
    const tasks = []

    // 工事請負/洗車機販売契約: OPEN日の約4ヶ月前 (6月1日から6月10日まで)
    const contractStartDate = new Date(openDate)
    contractStartDate.setMonth(openDate.getMonth() - 4)
    contractStartDate.setDate(1) // 6月1日
    const contractEndDate = new Date(contractStartDate)
    contractEndDate.setDate(10) // 6月10日
    tasks.push({
      id: "contract",
      name: "工事請負/洗車機販売契約",
      startDate: contractStartDate,
      endDate: contractEndDate,
      group: "バックオフィス",
      color: "#3b82f6", // blue-500
      memo: "",
      isHidden: false,
    })

    // 各種請求 (1回目): OPEN日の約4ヶ月前 (6月5日から6月15日まで)
    const firstBillingStartDate = new Date(openDate)
    firstBillingStartDate.setMonth(openDate.getMonth() - 4)
    firstBillingStartDate.setDate(5) // 6月5日
    const firstBillingEndDate = new Date(firstBillingStartDate)
    firstBillingEndDate.setDate(15) // 6月15日
    tasks.push({
      id: "billing-1",
      name: "各種請求",
      startDate: firstBillingStartDate,
      endDate: firstBillingEndDate,
      group: "バックオフィス",
      color: "#3b82f6",
      memo: "",
      isHidden: false,
    })

    // 洗車機発注: OPEN日の約4ヶ月前 (6月5日から6月15日まで)
    const machineOrderStartDate = new Date(openDate)
    machineOrderStartDate.setMonth(openDate.getMonth() - 4)
    machineOrderStartDate.setDate(5) // 6月5日
    const machineOrderEndDate = new Date(machineOrderStartDate)
    machineOrderEndDate.setDate(15) // 6月15日
    tasks.push({
      id: "machine-order",
      name: "洗車機発注",
      startDate: machineOrderStartDate,
      endDate: machineOrderEndDate,
      group: "バックオフィス",
      color: "#3b82f6",
      memo: "",
      isHidden: false,
    })

    // 地鎮祭: OPEN日の約3.5ヶ月前 (6月15日から6月18日まで)
    const groundbreakingStartDate = new Date(openDate)
    groundbreakingStartDate.setMonth(openDate.getMonth() - 3)
    groundbreakingStartDate.setDate(15) // 6月15日
    const groundbreakingEndDate = new Date(groundbreakingStartDate)
    groundbreakingEndDate.setDate(18) // 6月18日
    tasks.push({
      id: "groundbreaking",
      name: "地鎮祭",
      startDate: groundbreakingStartDate,
      endDate: groundbreakingEndDate,
      group: "洗車場開発",
      color: "#ff9900", // Amazon yellow/orange
      memo: "",
      isHidden: false,
    })

    // CUB/Comp手配: OPEN日の約3.5ヶ月前 (6月20日から6月23日まで)
    const cubicleProcurementStartDate = new Date(openDate)
    cubicleProcurementStartDate.setMonth(openDate.getMonth() - 3)
    cubicleProcurementStartDate.setDate(20) // 6月20日
    const cubicleProcurementEndDate = new Date(cubicleProcurementStartDate)
    cubicleProcurementEndDate.setDate(23) // 6月23日
    tasks.push({
      id: "cubicle-procurement",
      name: "CUB/Comp手配",
      startDate: cubicleProcurementStartDate,
      endDate: cubicleProcurementEndDate,
      group: "洗車場開発",
      color: "#ff9900",
      memo: "",
      isHidden: false,
    })

    // 井戸工事（井戸水使用の場合のみ）: OPEN日の約3.5ヶ月前から約3ヶ月前 (6月20日から7月4日まで)
    if (isWellWaterUsed) {
      const wellConstructionStartDate = new Date(openDate)
      wellConstructionStartDate.setMonth(openDate.getMonth() - 3)
      wellConstructionStartDate.setDate(20) // 6月20日
      const wellConstructionEndDate = new Date(wellConstructionStartDate)
      wellConstructionEndDate.setMonth(wellConstructionEndDate.getMonth() + 1)
      wellConstructionEndDate.setDate(4) // 7月4日
      tasks.push({
        id: "well-construction",
        name: "井戸工事",
        startDate: wellConstructionStartDate,
        endDate: wellConstructionEndDate,
        group: "洗車場開発",
        color: "#ff9900",
        memo: "",
        isHidden: false,
      })
    }

    // 洗車場土木関連工事: OPEN日の約3ヶ月前から約3週間前 (7月1日から9月10日まで)
    const civilWorkStartDate = new Date(openDate)
    civilWorkStartDate.setMonth(openDate.getMonth() - 3)
    civilWorkStartDate.setDate(1) // 7月1日
    const civilWorkEndDate = new Date(openDate)
    civilWorkEndDate.setMonth(openDate.getMonth() - 1)
    civilWorkEndDate.setDate(10) // 9月10日
    tasks.push({
      id: "civil-work",
      name: "洗車場土木関連工事",
      startDate: civilWorkStartDate,
      endDate: civilWorkEndDate,
      group: "洗車場開発",
      color: "#ff9900",
      memo: "",
      isHidden: false,
    })

    // ハイロックグッズ既存: OPEN日の約2ヶ月前 (8月1日から8月末まで)
    const promotionStartDate = new Date(openDate)
    promotionStartDate.setMonth(openDate.getMonth() - 2)
    promotionStartDate.setDate(1) // 8月1日
    const promotionEndDate = new Date(promotionStartDate)
    promotionEndDate.setMonth(promotionEndDate.getMonth() + 1)
    promotionEndDate.setDate(0) // 8月末日
    tasks.push({
      id: "promotion",
      name: "ハイロックグッズ既存",
      startDate: promotionStartDate,
      endDate: promotionEndDate,
      group: "バックオフィス",
      color: "#3b82f6",
      memo: "",
      isHidden: false,
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
    })

    // ハイロックグッズ新規: OPEN日の約2ヶ月前 (8月1日から8月末まで)
    const newGoodsStartDate = new Date(openDate)
    newGoodsStartDate.setMonth(openDate.getMonth() - 2)
    newGoodsStartDate.setDate(1) // 8月1日
    const newGoodsEndDate = new Date(newGoodsStartDate)
    newGoodsEndDate.setMonth(newGoodsEndDate.getMonth() + 1)
    newGoodsEndDate.setDate(0) // 8月末日
    tasks.push({
      id: "new-goods",
      name: "ハイロックグッズ新規",
      startDate: newGoodsStartDate,
      endDate: newGoodsEndDate,
      group: "バックオフィス",
      color: "#3b82f6",
      memo: "",
      isHidden: false,
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
    })

    // プロモーション戦略: OPEN日の約2ヶ月前 (8月1日から8月末まで)
    const marketingStartDate = new Date(openDate)
    marketingStartDate.setMonth(openDate.getMonth() - 2)
    marketingStartDate.setDate(1) // 8月1日
    const marketingEndDate = new Date(marketingStartDate)
    marketingEndDate.setMonth(marketingEndDate.getMonth() + 1)
    marketingEndDate.setDate(0) // 8月末日
    tasks.push({
      id: "marketing",
      name: "プロモーション戦略",
      startDate: marketingStartDate,
      endDate: marketingEndDate,
      group: "バックオフィス",
      color: "#3b82f6",
      memo: "",
      isHidden: false,
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
    })

    // 求人系: OPEN日の約2ヶ月前から約3週間前 (8月1日から9月10日まで)
    const recruitmentStartDate = new Date(openDate)
    recruitmentStartDate.setMonth(openDate.getMonth() - 2)
    recruitmentStartDate.setDate(1) // 8月1日
    const recruitmentEndDate = new Date(openDate)
    recruitmentEndDate.setMonth(openDate.getMonth() - 1)
    recruitmentEndDate.setDate(10) // 9月10日
    tasks.push({
      id: "recruitment",
      name: "求人系",
      startDate: recruitmentStartDate,
      endDate: recruitmentEndDate,
      group: "バックオフィス",
      color: "#3b82f6",
      memo: "",
      isHidden: false,
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
    })

    // 洗車機搬入@伊佐建設: OPEN日の約1.5ヶ月前 (8月15日から8月18日まで)
    const machineDeliveryIsaStartDate = new Date(openDate)
    machineDeliveryIsaStartDate.setMonth(openDate.getMonth() - 1)
    machineDeliveryIsaStartDate.setDate(15) // 8月15日
    const machineDeliveryIsaEndDate = new Date(machineDeliveryIsaStartDate)
    machineDeliveryIsaEndDate.setDate(18) // 8月18日
    tasks.push({
      id: "machine-delivery-isa",
      name: "洗車機搬入@伊佐建設",
      startDate: machineDeliveryIsaStartDate,
      endDate: machineDeliveryIsaEndDate,
      group: "洗車場開発",
      color: "#ff9900",
      memo: "",
      isHidden: false,
    })

    // 通信系: OPEN日の約1.5ヶ月前から約3週間前 (8月10日から9月10日まで)
    const operationContractStartDate = new Date(openDate)
    operationContractStartDate.setMonth(openDate.getMonth() - 2)
    operationContractStartDate.setDate(10) // 8月10日
    const operationContractEndDate = new Date(openDate)
    operationContractEndDate.setMonth(openDate.getMonth() - 1)
    operationContractEndDate.setDate(10) // 9月10日
    tasks.push({
      id: "operation-contract",
      name: "通信系",
      startDate: operationContractStartDate,
      endDate: operationContractEndDate,
      group: "バックオフィス",
      color: "#3b82f6",
      memo: "",
      isHidden: false,
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
    })

    // ガラス屋手配: OPEN日の約1.5ヶ月前 (8月20日から8月23日まで)
    const glassArrangementStartDate = new Date(openDate)
    glassArrangementStartDate.setMonth(openDate.getMonth() - 1)
    glassArrangementStartDate.setDate(20) // 8月20日
    const glassArrangementEndDate = new Date(glassArrangementStartDate)
    glassArrangementEndDate.setDate(23) // 8月23日
    tasks.push({
      id: "glass-arrangement",
      name: "ガラス屋手配",
      startDate: glassArrangementStartDate,
      endDate: glassArrangementEndDate,
      group: "洗車場開発",
      color: "#ff9900",
      memo: "",
      isHidden: false,
    })

    // 洗車機搬入@候補地: OPEN日の約3週間前 (9月7日から9月10日まで)
    const machineDeliverySiteStartDate = new Date(openDate)
    machineDeliverySiteStartDate.setDate(openDate.getDate() - 24) // 9月7日
    const machineDeliverySiteEndDate = new Date(openDate)
    machineDeliverySiteEndDate.setDate(openDate.getDate() - 21) // 9月10日
    tasks.push({
      id: "machine-delivery-site",
      name: "洗車機搬入@候補地",
      startDate: machineDeliverySiteStartDate,
      endDate: machineDeliverySiteEndDate,
      group: "洗車場開発",
      color: "#ff9900",
      memo: "",
      isHidden: false,
    })

    // 各種請求 (2回目): 洗車機搬入@候補地の開始日から1週間後まで
    const secondBillingStartDate = new Date(machineDeliverySiteStartDate)
    const secondBillingEndDate = new Date(secondBillingStartDate)
    secondBillingEndDate.setDate(secondBillingStartDate.getDate() + 7)
    tasks.push({
      id: "billing-2",
      name: "各種請求",
      startDate: secondBillingStartDate,
      endDate: secondBillingEndDate,
      group: "バックオフィス",
      color: "#3b82f6",
      memo: "",
      isHidden: false,
    })

    // 洗車機設営: OPEN日の約3週間前から前日まで (9月10日から9月末まで)
    const washingMachineInstallStartDate = new Date(openDate)
    washingMachineInstallStartDate.setDate(openDate.getDate() - 21) // 9月10日
    const washingMachineInstallEndDate = new Date(openDate)
    washingMachineInstallEndDate.setDate(openDate.getDate() - 1) // 9月末（OPEN日の前日）
    tasks.push({
      id: "washing-machine-install",
      name: "洗車機設営",
      startDate: washingMachineInstallStartDate,
      endDate: washingMachineInstallEndDate,
      group: "洗車場開発",
      color: "#ff9900",
      memo: "",
      isHidden: false,
    })

    // 運営備品手配: OPEN日の約3週間前から前日まで (9月10日から9月末まで)
    const suppliesProcurementStartDate = new Date(openDate)
    suppliesProcurementStartDate.setDate(openDate.getDate() - 21) // 9月10日
    const suppliesProcurementEndDate = new Date(openDate)
    suppliesProcurementEndDate.setDate(openDate.getDate() - 1) // 9月末（OPEN日の前日）
    tasks.push({
      id: "supplies-procurement",
      name: "運営備品手配",
      startDate: suppliesProcurementStartDate,
      endDate: suppliesProcurementEndDate,
      group: "洗車場開発",
      color: "#ff9900",
      memo: "",
      isHidden: false,
    })

    // ガラスIN: OPEN日の約10日前から約5日前 (9月20日から9月25日まで)
    const glassInStartDate = new Date(openDate)
    glassInStartDate.setDate(openDate.getDate() - 11) // 9月20日
    const glassInEndDate = new Date(openDate)
    glassInEndDate.setDate(openDate.getDate() - 6) // 9月25日
    tasks.push({
      id: "glass-in",
      name: "ガラスIN",
      startDate: glassInStartDate,
      endDate: glassInEndDate,
      group: "洗車場開発",
      color: "#ff9900",
      memo: "",
      isHidden: false,
    })

    // 現場研修: 洗車機設営の開始日前日から1ヶ月前まで
    const trainingEndDate = new Date(washingMachineInstallStartDate)
    trainingEndDate.setDate(trainingEndDate.getDate() - 1) // 洗車機設営の開始日前日
    const trainingStartDate = new Date(trainingEndDate)
    trainingStartDate.setMonth(trainingStartDate.getMonth() - 1) // 1ヶ月前
    tasks.push({
      id: "training",
      name: "現場研修",
      startDate: trainingStartDate,
      endDate: trainingEndDate,
      group: "バックオフィス",
      color: "#3b82f6",
      memo: "",
      isHidden: false,
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
    })

    // タスクを開始日でソート
    tasks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

    setTasks(tasks)

    // プロジェクトのOPEN日を更新
    updateProjectOpenDate(currentProjectId, openDate)

    toast({
      title: "スケジュール生成完了",
      description: `OPEN日: ${format(openDate, "yyyy年MM月dd日", { locale: ja })}`,
    })
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-lg">
      <div className="space-y-6">
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
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                  {date ? format(date, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} locale={ja} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <Checkbox
                id="well-water"
                checked={isWellWaterUsed}
                onCheckedChange={(checked) => {
                  setIsWellWaterUsed(checked === true)
                }}
                className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <label
                htmlFor="well-water"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5 text-slate-700"
              >
                <span>井戸水使用</span>
                {isWellWaterUsed && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
              </label>
            </div>
          </div>
        </div>

        <Button
          onClick={generateSchedule}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-md"
          disabled={!date}
        >
          スケジュール生成
        </Button>
      </div>
    </div>
  )
}
