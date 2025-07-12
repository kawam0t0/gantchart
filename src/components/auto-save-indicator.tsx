"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Save, Check, AlertCircle, Clock } from "lucide-react"
import { useAutoSaveStore } from "@/lib/auto-save-store"

export function AutoSaveIndicator() {
  const { status, lastSaved } = useAutoSaveStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (status === "saving" || status === "saved" || status === "error") {
      setVisible(true)

      if (status === "saved" || status === "error") {
        const timer = setTimeout(() => {
          setVisible(false)
        }, 3000)

        return () => clearTimeout(timer)
      }
    }
  }, [status])

  if (!visible && status === "idle") return null

  return (
    <div className="flex items-center space-x-2 text-sm animate-fade-in">
      {status === "saving" && (
        <>
          <Save className="h-4 w-4 text-slate-500 animate-pulse" />
          <span className="text-slate-500">保存中...</span>
        </>
      )}

      {status === "saved" && (
        <>
          <Check className="h-4 w-4 text-blue-500" />
          <span className="text-blue-600">保存完了</span>
          {lastSaved && (
            <span className="text-slate-400 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {format(lastSaved, "HH:mm:ss", { locale: ja })}
            </span>
          )}
        </>
      )}

      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-red-600">保存エラー</span>
        </>
      )}
    </div>
  )
}
