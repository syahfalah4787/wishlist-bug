import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*, categories(name)')
      .eq('status', 'done')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const bugFixed = data.filter(item => item.type === 'bug');
    const featureAdded = data.filter(item => item.type === 'new_feature');
    const featureUpdated = data.filter(item => item.type === 'feature_update');

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
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}