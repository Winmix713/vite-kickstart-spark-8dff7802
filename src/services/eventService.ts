import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Event = Database['public']['Tables']['events']['Row']

export const eventService = {
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data
  },

  async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}