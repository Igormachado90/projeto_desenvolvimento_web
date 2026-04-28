
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking TOTAL counts in database:");
    const tables = ['Alunos', 'PEIs', 'Escolas', 'Turmas', 'Professores'];
    for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        console.log(`${t}: ${count} (Error: ${error?.message || 'None'})`);
    }
}
check();
