const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name, teacher_id, profiles(full_name)')
    .eq('class_code', '100543')
    .single();

  console.log("DATA:", data);
  console.log("ERROR:", error);
}

test();
