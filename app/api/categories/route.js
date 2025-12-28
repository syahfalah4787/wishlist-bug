import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// GET semua kategori
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST kategori baru
export async function POST(request) {
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return Response.json({ error: 'Nama kategori harus diisi' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: name.trim() }])
      .select()
      .single();

    if (error) throw error;
    return Response.json({ data }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}