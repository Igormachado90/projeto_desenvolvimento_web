
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables'); // If RLS allows or custom RPC exists
    if (error) {
        console.log("RPC get_tables failed. Trying direct queries to common tables...");
    }
    
    const common = ['Alunos', 'Usuarios', 'profiles', 'Plataformas', 'Escolas'];
    for (const t of common) {
        const { data: sample, error: err } = await supabase.from(t).select('*').limit(1);
        if (err) {
            console.log(`Table ${t}: Error (${err.message})`);
        } else {
            console.log(`Table ${t}: EXISTS. Columns: ${sample && sample.length > 0 ? Object.keys(sample[0]).join(', ') : 'No data'}`);
        }
    }
}
listTables();
