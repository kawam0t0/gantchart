import { createClient } from "@supabase/supabase-js"

// 環境変数が設定されていることを確認
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.")
}

// クライアントサイドで使用するためのSupabaseクライアントをシングルトンパターンで作成
// これにより、複数の場所でインポートされても常に同じインスタンスが使用され、
// 不必要な再初期化を防ぎます。
const supabaseUrlNonNull = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKeyNonNull = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseClient = createClient(supabaseUrlNonNull, supabaseAnonKeyNonNull)
