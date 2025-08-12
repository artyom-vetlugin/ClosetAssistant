import { supabase } from './supabase'

export class WearLogService {
  static async logWear(outfitId: string, date?: string): Promise<void> {
    const user = await supabase.auth.getUser()
    if (!user.data.user) throw new Error('Not authenticated')
    const { error } = await supabase.from('wear_logs').insert({
      user_id: user.data.user.id,
      outfit_id: outfitId,
      worn_date: date ?? new Date().toISOString().slice(0, 10),
    })
    if (error) throw error
  }

  static async getHistory() {
    const { data, error } = await supabase
      .from('wear_logs')
      .select(`
        id, worn_date, created_at,
        outfits (
          id, name, created_at,
          outfit_items (
            role,
            clothing_items (*)
          )
        )
      `)
      .order('worn_date', { ascending: false })

    if (error) throw error
    return data ?? []
  }
}


