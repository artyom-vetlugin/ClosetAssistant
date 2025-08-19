import { supabase } from './supabase'
import type { ClothingItem, Outfit, WearLog, OutfitItem } from './supabase'

export class WearLogService {
  static async logWear(outfitId: string, date?: string): Promise<void> {
    const user = await supabase.auth.getUser()
    if (!user.data.user) throw new Error('Not authenticated')
    const payload = {
      user_id: user.data.user.id,
      outfit_id: outfitId,
      worn_date: date ?? new Date().toISOString().slice(0, 10),
    }

    // Try new schema first (wear_logs with outfit_id reference to outfits)
    const { error } = await supabase.from('wear_logs').insert(payload)
    if (!error) return

    // Fallback for legacy schema: wear_logs requires item_ids and outfit_id references saved_outfits
    try {
      // Determine item_ids from either outfits -> outfit_items (new) or saved_outfits (legacy)
      let itemIds: string[] | null = null

      // Try outfits + outfit_items first
      const { data: oi, error: oiErr } = await supabase
        .from('outfit_items')
        .select('item_id')
        .eq('outfit_id', outfitId)

      if (!oiErr && oi && oi.length) {
        itemIds = (oi as { item_id: string }[]).map((x) => x.item_id)
      } else {
        // Try legacy saved_outfits
        const { data: legacy, error: legacyErr } = await supabase
          .from('saved_outfits')
          .select('item_ids')
          .eq('id', outfitId)
          .single()
        if (!legacyErr && legacy && (legacy as { item_ids?: string[] }).item_ids) {
          itemIds = ((legacy as { item_ids?: string[] }).item_ids || [])
        }
      }

      if (!itemIds || itemIds.length === 0) {
        throw error
      }

      const { error: legacyInsertErr } = await supabase.from('wear_logs').insert({
        ...payload,
        item_ids: itemIds,
      })
      if (legacyInsertErr) throw legacyInsertErr
    } catch (fallbackErr) {
      throw fallbackErr
    }
  }

  static async deleteWearLog(logId: string): Promise<void> {
    const user = await supabase.auth.getUser()
    if (!user.data.user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('wear_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.data.user.id)

    if (error) throw error
  }

  static async updateWearLogDate(logId: string, wornDate: string): Promise<void> {
    const user = await supabase.auth.getUser()
    if (!user.data.user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('wear_logs')
      .update({ worn_date: wornDate })
      .eq('id', logId)
      .eq('user_id', user.data.user.id)

    if (error) throw error
  }

  static async getHistory(): Promise<Array<{
    id: string
    worn_date: string
    created_at: string
    outfits: Outfit & { outfit_items: { role: OutfitItem['role']; clothing_items: ClothingItem }[] }
  }>> {
    // First try: nested join (new schema)
    const { data, error } = await supabase
      .from('wear_logs')
      .select(`
        id, worn_date, created_at,
        outfits (
          id, user_id, name, created_at,
          outfit_items (
            role,
            clothing_items (*)
          )
        )
      `)
      .order('worn_date', { ascending: false })

    if (!error && data) {
      return data as unknown as Array<{
        id: string
        worn_date: string
        created_at: string
        outfits: Outfit & { outfit_items: { role: OutfitItem['role']; clothing_items: ClothingItem }[] }
      }>
    }

    // Fallback path: manual expansion for legacy or missing relationships
    const { data: logs, error: logsErr } = await supabase
      .from('wear_logs')
      .select('*')
      .order('worn_date', { ascending: false })
    if (logsErr) throw logsErr

    const results: Array<{
      id: string
      worn_date: string
      created_at: string
      outfits: Outfit & { outfit_items: { role: OutfitItem['role']; clothing_items: ClothingItem }[] }
    }> = []

    for (const log of (logs || []) as WearLog[]) {
      // Try outfits first (new schema)
      const { data: outfit, error: outfitErr } = await supabase
        .from('outfits')
        .select('id, user_id, name, created_at')
        .eq('id', log.outfit_id)
        .single()

      if (!outfitErr && outfit) {
        const { data: oi, error: oiErr } = await supabase
          .from('outfit_items')
          .select('role, clothing_items(*)')
          .eq('outfit_id', outfit.id)
        if (oiErr) throw oiErr
        const joins = (oi || []).map((row: { role: OutfitItem['role']; clothing_items: ClothingItem[] }) => {
          // clothing_items is an array, but we want to flatten to individual items
          return (row.clothing_items || []).map((ci) => ({
            role: row.role,
            clothing_items: ci,
          }))
        }).flat()
        results.push({
          id: log.id,
          worn_date: log.worn_date,
          created_at: log.created_at,
          outfits: {
            ...(outfit as Outfit),
            outfit_items: joins,
          },
        })
        continue
      }

      // Legacy fallback: saved_outfits + item_ids
      const { data: legacy, error: legacyErr } = await supabase
        .from('saved_outfits')
        .select('id, user_id, name, created_at, item_ids')
        .eq('id', log.outfit_id)
        .single()
      if (legacyErr || !legacy) {
        // Skip this log if neither schema resolves cleanly
        continue
      }

      const ids = (legacy as unknown as { item_ids: string[] }).item_ids || []
      const { data: items, error: itemsErr } = await supabase
        .from('clothing_items')
        .select('*')
        .in('id', ids)
      if (itemsErr) throw itemsErr

      const outfitItems = (items || []).map((ci) => ({
        role: 'accessory' as OutfitItem['role'],
        clothing_items: ci as ClothingItem,
      }))

      const legacyRow = legacy as unknown as { id: string; user_id: string; name: string; created_at: string }
      results.push({
        id: log.id,
        worn_date: log.worn_date,
        created_at: log.created_at,
        outfits: {
          id: legacyRow.id,
          user_id: legacyRow.user_id,
          name: legacyRow.name,
          created_at: legacyRow.created_at,
          outfit_items: outfitItems,
        },
      })
    }

    return results
  }
}


