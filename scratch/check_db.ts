import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const tables = ['alunos', 'peis', 'profissionais', 'escolas', 'usuarios', 'agenda'];
  console.log('Checking tables...');
  
  for (const table of tables) {
    try {
      const { data, count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`Table ${table}: Error - ${error.message}`);
      } else {
        console.log(`Table ${table}: ${count} rows found.`);
      }
    } catch (e: any) {
      console.log(`Table ${table}: Exception - ${e.message}`);
    }
  }
}

checkData();
