import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { CardAttachment } from '@/types'

interface AttachmentState {
  uploading: boolean
  fetchAttachments: (cardId: string) => Promise<CardAttachment[]>
  uploadAttachment: (cardId: string, file: File, userId: string) => Promise<CardAttachment>
  deleteAttachment: (attachment: CardAttachment) => Promise<void>
}

export const useAttachmentStore = create<AttachmentState>(() => ({
  uploading: false,

  fetchAttachments: async (cardId) => {
    const { data, error } = await supabase
      .from('card_attachments')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as unknown as CardAttachment[]
  },

  uploadAttachment: async (cardId, file, userId) => {
    const ext = file.name.split('.').pop()
    const path = `${cardId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('card-attachments')
      .upload(path, file)

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = supabase.storage
      .from('card-attachments')
      .getPublicUrl(path)

    const { data, error } = await supabase
      .from('card_attachments')
      .insert({
        card_id: cardId,
        name: file.name,
        url: publicUrl,
        size: file.size,
        mime_type: file.type,
        uploaded_by: userId,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as CardAttachment
  },

  deleteAttachment: async (attachment) => {
    // Extract storage path from URL
    const url = new URL(attachment.url)
    const path = url.pathname.split('/card-attachments/')[1]

    await supabase.storage.from('card-attachments').remove([path])

    const { error } = await supabase
      .from('card_attachments')
      .delete()
      .eq('id', attachment.id)

    if (error) throw new Error(error.message)
  },
}))
