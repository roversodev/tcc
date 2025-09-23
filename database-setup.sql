-- =============================================
-- VELLUM DATABASE SETUP - SUPABASE
-- =============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. TABELA PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    current_company_id UUID,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. TABELA COMPANIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cnpj TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'Brasil',
    website TEXT,
    logo_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. TABELA COMPANY_MEMBERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES public.profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- =============================================
-- 4. TABELA PRODUCT_CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. TABELA CLIENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    endereco TEXT,
    data_nascimento DATE,
    categoria TEXT DEFAULT 'Novo' CHECK (categoria IN ('VIP', 'Regular', 'Novo')),
    ultimo_atendimento TIMESTAMPTZ,
    total_gasto DECIMAL(10,2) DEFAULT 0,
    observacoes TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. TABELA PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    nome TEXT NOT NULL,
    codigo TEXT,
    categoria_id UUID REFERENCES public.product_categories(id),
    preco DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    quantidade INTEGER DEFAULT 0,
    estoque_minimo INTEGER DEFAULT 0,
    fornecedor TEXT,
    data_ultima_entrada TIMESTAMPTZ,
    status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Estoque Baixo')),
    descricao TEXT,
    unidade TEXT DEFAULT 'un' CHECK (unidade IN ('un', 'kg', 'L', 'ml', 'g')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. TABELA SERVICES
-- =============================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    header TEXT NOT NULL,
    type TEXT DEFAULT 'service',
    status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    target DECIMAL(10,2),
    reviewer TEXT,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. TABELA EVENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    client_id UUID REFERENCES public.clients(id),
    service_id UUID REFERENCES public.services(id),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    color TEXT DEFAULT 'sky' CHECK (color IN ('sky', 'amber', 'violet', 'rose', 'emerald', 'orange')),
    location TEXT,
    cliente TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. TABELA FINANCIAL_MOVEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.financial_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    client_id UUID REFERENCES public.clients(id),
    event_id UUID REFERENCES public.events(id),
    type TEXT NOT NULL CHECK (type IN ('faturamento', 'despesa')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. TRIGGERS PARA UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 11. FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 12. FUNÇÃO PARA CRIAR EMPRESA COM OWNER
-- =============================================
CREATE OR REPLACE FUNCTION public.create_company_with_owner(
    company_name TEXT,
    owner_user_id UUID,
    company_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
    new_company_id UUID;
BEGIN
    -- Criar a empresa
    INSERT INTO public.companies (
        name,
        owner_id,
        cnpj,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        website
    ) VALUES (
        company_name,
        owner_user_id,
        company_data->>'cnpj',
        company_data->>'email',
        company_data->>'phone',
        company_data->>'address',
        company_data->>'city',
        company_data->>'state',
        company_data->>'zip_code',
        company_data->>'website'
    ) RETURNING id INTO new_company_id;

    -- Adicionar o owner como membro
    INSERT INTO public.company_members (
        company_id,
        user_id,
        role
    ) VALUES (
        new_company_id,
        owner_user_id,
        'owner'
    );

    -- Atualizar o perfil do usuário
    UPDATE public.profiles 
    SET 
        current_company_id = new_company_id,
        onboarding_completed = TRUE
    WHERE id = owner_user_id;

    -- Criar categorias padrão
    INSERT INTO public.product_categories (company_id, name, description) VALUES
        (new_company_id, 'Produtos de Beleza', 'Produtos para cuidados com cabelo, pele e unhas'),
        (new_company_id, 'Equipamentos', 'Ferramentas e equipamentos para salão'),
        (new_company_id, 'Consumíveis', 'Produtos de uso único e materiais descartáveis');

    RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 13. POLÍTICAS RLS SIMPLES E SEGURAS
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_movements ENABLE ROW LEVEL SECURITY;

-- PROFILES: Usuários podem ver e editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- COMPANIES: Usuários podem ver empresas onde são membros
CREATE POLICY "Users can view companies they are members of" ON public.companies
    FOR SELECT USING (
        id IN (
            SELECT company_id 
            FROM public.company_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update companies they own" ON public.companies
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can insert companies" ON public.companies
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- COMPANY_MEMBERS: Usuários podem ver membros das empresas onde participam
CREATE POLICY "Users can view members of their companies" ON public.company_members
    FOR SELECT USING (
        company_id IN (
            SELECT company_id 
            FROM public.company_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert members to their companies" ON public.company_members
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id 
            FROM public.companies 
            WHERE owner_id = auth.uid()
        )
    );

-- DEMAIS TABELAS: Acesso baseado na empresa do usuário
CREATE POLICY "Company data access" ON public.product_categories
    FOR ALL USING (
        company_id IN (
            SELECT company_id 
            FROM public.company_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company data access" ON public.clients
    FOR ALL USING (
        company_id IN (
            SELECT company_id 
            FROM public.company_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company data access" ON public.products
    FOR ALL USING (
        company_id IN (
            SELECT company_id 
            FROM public.company_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company data access" ON public.services
    FOR ALL USING (
        company_id IN (
            SELECT company_id 
            FROM public.company_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company data access" ON public.events
    FOR ALL USING (
        company_id IN (
            SELECT company_id 
            FROM public.company_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Company data access" ON public.financial_movements
    FOR ALL USING (
        company_id IN (
            SELECT company_id 
            FROM public.company_members 
            WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- 14. VIEW PARA DASHBOARD STATS
-- =============================================
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT 
    cm.company_id,
    cm.user_id,
    COALESCE(client_stats.total_clientes, 0) as total_clientes,
    COALESCE(client_stats.clientes_vip, 0) as clientes_vip,
    COALESCE(client_stats.clientes_novos, 0) as clientes_novos,
    COALESCE(product_stats.produtos_estoque, 0) as produtos_estoque,
    COALESCE(financial_stats.faturamento_total, 0) as faturamento_total,
    COALESCE(financial_stats.faturamento_mensal, 0) as faturamento_mensal
FROM public.company_members cm
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as total_clientes,
        COUNT(*) FILTER (WHERE categoria = 'VIP') as clientes_vip,
        COUNT(*) FILTER (WHERE categoria = 'Novo') as clientes_novos
    FROM public.clients 
    WHERE status = 'active'
    GROUP BY company_id
) client_stats ON cm.company_id = client_stats.company_id
LEFT JOIN (
    SELECT 
        company_id,
        COUNT(*) as produtos_estoque
    FROM public.products 
    WHERE status = 'Ativo'
    GROUP BY company_id
) product_stats ON cm.company_id = product_stats.company_id
LEFT JOIN (
    SELECT 
        company_id,
        SUM(amount) FILTER (WHERE type = 'faturamento') as faturamento_total,
        SUM(amount) FILTER (WHERE type = 'faturamento' AND date >= DATE_TRUNC('month', CURRENT_DATE)) as faturamento_mensal
    FROM public.financial_movements
    GROUP BY company_id
) financial_stats ON cm.company_id = financial_stats.company_id;

-- =============================================
-- 15. ÍNDICES PARA PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_current_company ON public.profiles(current_company_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON public.clients(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_services_company ON public.services(company_id);
CREATE INDEX IF NOT EXISTS idx_events_company ON public.events(company_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_financial_movements_company ON public.financial_movements(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_movements_date ON public.financial_movements(date);

-- =============================================
-- SCRIPT CONCLUÍDO
-- =============================================