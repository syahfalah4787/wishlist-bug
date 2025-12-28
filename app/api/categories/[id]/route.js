import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// DELETE kategori
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return Response.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 