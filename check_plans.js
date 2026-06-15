import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPlans() {
  const { data, error } = await supabase.from('pbm_plans').select('*');
  console.log("Plans data:", data);
  console.log("Plans error:", error);
}

checkPlans();
