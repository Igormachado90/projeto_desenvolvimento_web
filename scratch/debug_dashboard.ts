
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking Alunos table...");
    const { data, error } = await supabase.from('Alunos').select('Aluno_ID, Nome, Status, Plataforma_ID').limit(10);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Students sample:", data);
    }

    console.log("\nChecking Table Names...");
    const { data: tables, error: tableError } = await supabase.rpc('get_tables'); // If rpc exists
    if (tableError) {
        // Fallback: search for specific table
        const { error: acompanhamentoError } = await supabase.from('Acompanhamentos').select('*', { count: 'exact', head: true });
        console.log("Acompanhamentos connection test:", acompanhamentoError ? "Failed" : "Success");
    }
}

check();
