import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// PATCH update status item
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    
    // Validasi status
    const validStatus = ['belum', 'proses', 'done'];
    if (!validStatus.includes(status)) {
      return Response.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('items')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        categories (
          name
        )
      `)
      .single();

    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE item
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return Response.json({ message: 'Item berhasil dihapus' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}