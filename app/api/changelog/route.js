import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ 
        data: 'Configuration error',
        stats: { bugFixed: 0, featureAdded: 0, featureUpdated: 0 }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Cara 1: Query langsung (lebih reliable)
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'done')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      // Fallback: coba tanpa join
      const { data: simpleData, error: simpleError } = await supabase
        .from('items')
        .select('id, title, type, status')
        .eq('status', 'done')
        .order('created_at', { ascending: false });
      
      if (simpleError) {
        return Response.json({ 
          data: 'Database query failed',
          stats: { bugFixed: 0, featureAdded: 0, featureUpdated: 0 }
        });
      }
      
      return buildChangelog(simpleData);
    }
    
    return buildChangelog(data);
    
  } catch (error) {
    console.error('Changelog API error:', error);
    return Response.json({ 
      data: 'Server error',
      stats: { bugFixed: 0, featureAdded: 0, featureUpdated: 0 }
    });
  }
}

// Helper function untuk build changelog
function buildChangelog(items) {
  if (!items || items.length === 0) {
    return Response.json({ 
      data: 'Belum ada changelog',
      stats: { bugFixed: 0, featureAdded: 0, featureUpdated: 0 }
    });
  }
  
  const bugFixed = items.filter(item => item.type === 'bug');
  const featureAdded = items.filter(item => item.type === 'new_feature');
  const featureUpdated = items.filter(item => item.type === 'feature_update');
  
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
      totalDoneItems: items.length,
      items: items.map(i => ({ id: i.id, title: i.title, type: i.type, status: i.status }))
    }
  });
}