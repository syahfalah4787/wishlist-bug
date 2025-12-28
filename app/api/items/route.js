import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  let query = supabase
    .from('items')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  if (type) query = query.eq('type', type);

  const { data, error } = await query;
  
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const title = formData.get('title');
    const category_id = formData.get('category_id');
    const type = formData.get('type');
    const image = formData.get('image');
    
    if (!title || !category_id || !type) {
      return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    let imageUrl = null;
    
    if (image && image.size > 0) {
      const fileName = `${Date.now()}_${image.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bug-images')
        .upload(fileName, image);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('bug-images')
        .getPublicUrl(fileName);
      
      imageUrl = urlData.publicUrl;
    }

    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .insert([{ 
        title, 
        category_id,
        type,
        image_url: imageUrl
      }])
      .select('*, categories(name)')
      .single();

    if (itemError) throw itemError;
    return Response.json({ data: itemData }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}