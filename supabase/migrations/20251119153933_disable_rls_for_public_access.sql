/*
  # Desativar RLS para acesso público
  
  Desativa Row Level Security em todas as tabelas para permitir acesso direto sem autenticação.
  
  ## Alterações
  - Desativa RLS em todas as tabelas
  - Remove políticas que requerem autenticação
*/

-- Desativar RLS em todas as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales_performance DISABLE ROW LEVEL SECURITY;
