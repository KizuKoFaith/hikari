import supabase from '@/client/SupabaseClient'

interface Book {
  series_id: number
  title_en: string
  cover_url: string
  published_at?: string   // optional, format: 'YYYY-MM-DD'
  link_url: string
  synopsis?: string       // optional, defaults to ''
}

const InsertBook = async (book: Book) => {
  const { data, error } = await supabase
    .from('books')
    .insert([book])

  if (error) {
    console.error('Error inserting book:', error.message)
    throw error
  }

  return data
}

export default InsertBook