import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    // Set headers untuk disable cache
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ 
        data: 'Configuration error',
        stats: { bugFixed: 0, featureAdded: 0, featureUpdated: 0 }
      }, { headers });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Query langsung - ambil hanya data yang ada sekarang
    const { data, error } = await supabase
      .from('items')
      .select('id, title, type, created_at')
      .eq('status', 'done')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Changelog query error:', error);
      return Response.json({ 
        data: 'Error fetching data',
        stats: { bugFixed: 0, featureAdded: 0, featureUpdated: 0 }
      }, { headers });
    }

    // Pastikan data tidak null
    const items = data || [];
    
    // Log untuk debugging
    console.log(`Changelog: Found ${items.length} done items`);

    if (items.length === 0) {
      return Response.json({ 
        data: 'Belum ada changelog',
        stats: { bugFixed: 0, featureAdded: 0, featureUpdated: 0 },
        timestamp: new Date().toISOString()
      }, { headers });
    }

    // Group items by type
    const bugFixed = items.filter(item => item.type === 'bug');
    const featureAdded = items.filter(item => item.type === 'new_feature');
    const featureUpdated = items.filter(item => item.type === 'feature_update');

    // Build changelog
    let changelog = '';
    
    if (bugFixed.length > 0) {
      changelog += 'BUG FIXED:\n';
      bugFixed.forEach((item, index) => {
        changelog += `${index + 1}. Fix: ${item.title}\n`;
      });
      changelog += '\n';
    }
    
    if (featureAdded.length > 0) {
      changelog += 'ADD FEATURE:\n';
      featureAdded.forEach((item, index) => {
        changelog += `${index + 1}. Add: ${item.title}\n`;
      });
      changelog += '\n';
    }
    
    if (featureUpdated.length > 0) {
      changelog += 'CHANGES:\n';
      featureUpdated.forEach((item, index) => {
        changelog += `${index + 1}. Changes: ${item.title}\n`;
      });
    }

    return Response.json({ 
      data: changelog,
      stats: {
        bugFixed: bugFixed.length,
        featureAdded: featureAdded.length,
        featureUpdated: featureUpdated.length
      },
      debug: {
        totalItems: items.length,
        timestamp: new Date().toISOString(),
        itemIds: items.map(i => i.id) // Untuk verifikasi
      }
    }, { headers });

  } catch (error) {
    console.error('Changelog API error:', error);
    return Response.json({ 
      data: 'Server error',
      stats: { bugFixed: 0, featureAdded: 0, featureUpdated: 0 },
      error: error.message
    }, { 
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}