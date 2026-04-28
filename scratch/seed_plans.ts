import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const plans = [
  { nome: '5 Alunos', quantidade_alunos: 5, valor_mensal: 125.00, valor_aluno_excedente: 23.00, valor_onboarding: 3497.00, status: 'Ativo' },
  { nome: '10 Alunos', quantidade_alunos: 10, valor_mensal: 240.00, valor_aluno_excedente: 21.00, valor_onboarding: 3497.00, status: 'Ativo' },
  { nome: '15 Alunos', quantidade_alunos: 15, valor_mensal: 330.00, valor_aluno_excedente: 22.00, valor_onboarding: 3497.00, status: 'Ativo' },
  { nome: '20 Alunos', quantidade_alunos: 20, valor_mensal: 440.00, valor_aluno_excedente: 19.00, valor_onboarding: 3497.00, status: 'Ativo' },
  { nome: '30 Alunos', quantidade_alunos: 30, valor_mensal: 600.00, valor_aluno_excedente: 20.00, valor_onboarding: 3497.00, status: 'Ativo' },
  { nome: '50 Alunos', quantidade_alunos: 50, valor_mensal: 1000.00, valor_aluno_excedente: 16.00, valor_onboarding: 3497.00, status: 'Ativo' },
  { nome: '100 Alunos', quantidade_alunos: 100, valor_mensal: 1750.00, valor_aluno_excedente: 13.00, valor_onboarding: 3497.00, status: 'Ativo' },
  { nome: '200 Alunos', quantidade_alunos: 200, valor_mensal: 3200.00, valor_aluno_excedente: 16.00, valor_onboarding: 3497.00, status: 'Ativo' },
  { nome: '500 Alunos', quantidade_alunos: 500, valor_mensal: 6500.00, valor_aluno_excedente: 10.00, valor_onboarding: 3497.00, status: 'Ativo' },
  { nome: 'Institucional Plus', quantidade_alunos: 1000, valor_mensal: 12000.00, valor_aluno_excedente: 12.00, valor_onboarding: 5000.00, status: 'Ativo' },
];

async function seed() {
  console.log('--- Iniciando Sincronização de Planos ---');
  
  // 1. Limpar planos existentes para evitar duplicidade
  console.log('Limpando registros antigos...');
  const { error: deleteError } = await supabase.from('planos').delete().neq('plano_id', 0);
  
  if (deleteError) {
    console.error('Erro ao limpar planos (RLS pode estar bloqueando):', deleteError.message);
    console.log('Dica: Execute "DELETE FROM planos;" diretamente no Supabase SQL Editor.');
  }

  // 2. Inserir os 10 planos oficiais
  console.log('Inserindo catálogo oficial (10 itens)...');
  const { data, error: insertError } = await supabase.from('planos').insert(plans);
  
  if (insertError) {
    console.error('Erro na inserção:', insertError.message);
  } else {
    console.log('✅ Catálogo de planos sincronizado com sucesso!');
  }
}

seed();
