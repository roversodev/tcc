export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: string
          onboarding_completed: boolean
          created_at: string
          updated_at: string
          email: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
          email?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
          email?: string | null
        }
      }
      companies: {
        Row: {
          id: string
          owner_id: string
          name: string
          cnpj: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          website: string | null
          logo_url: string | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          cnpj?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          website?: string | null
          logo_url?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          cnpj?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          website?: string | null
          logo_url?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      company_members: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          permissions: Json
          invited_by: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          permissions?: Json
          invited_by?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          permissions?: Json
          invited_by?: string | null
          joined_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          company_id: string
          created_by: string | null
          nome: string
          email: string | null
          telefone: string | null
          endereco: string | null
          data_nascimento: string | null
          categoria: 'VIP' | 'Regular' | 'Novo'
          ultimo_atendimento: string | null
          total_gasto: number
          observacoes: string | null
          avatar_url: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          created_by?: string | null
          nome: string
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          data_nascimento?: string | null
          categoria?: 'VIP' | 'Regular' | 'Novo'
          ultimo_atendimento?: string | null
          total_gasto?: number
          observacoes?: string | null
          avatar_url?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          created_by?: string | null
          nome?: string
          email?: string | null
          telefone?: string | null
          endereco?: string | null
          data_nascimento?: string | null
          categoria?: 'VIP' | 'Regular' | 'Novo'
          ultimo_atendimento?: string | null
          total_gasto?: number
          observacoes?: string | null
          avatar_url?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      product_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          company_id: string
          created_by: string | null
          nome: string
          codigo: string | null
          categoria_id: string | null
          preco: number | null
          cost_price: number | null
          quantidade: number
          estoque_minimo: number
          fornecedor: string | null
          data_ultima_entrada: string | null
          status: 'Ativo' | 'Inativo' | 'Estoque Baixo'
          descricao: string | null
          unidade: 'un' | 'kg' | 'L' | 'ml' | 'g'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          created_by?: string | null
          nome: string
          codigo?: string | null
          categoria_id?: string | null
          preco?: number | null
          cost_price?: number | null
          quantidade?: number
          estoque_minimo?: number
          fornecedor?: string | null
          data_ultima_entrada?: string | null
          status?: 'Ativo' | 'Inativo' | 'Estoque Baixo'
          descricao?: string | null
          unidade?: 'un' | 'kg' | 'L' | 'ml' | 'g'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          created_by?: string | null
          nome?: string
          codigo?: string | null
          categoria_id?: string | null
          preco?: number | null
          cost_price?: number | null
          quantidade?: number
          estoque_minimo?: number
          fornecedor?: string | null
          data_ultima_entrada?: string | null
          status?: 'Ativo' | 'Inativo' | 'Estoque Baixo'
          descricao?: string | null
          unidade?: 'un' | 'kg' | 'L' | 'ml' | 'g'
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          company_id: string
          created_by: string | null
          header: string
          type: string
          status: 'Ativo' | 'Inativo'
          target: number | null
          reviewer: string | null
          description: string | null
          duration_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          created_by?: string | null
          header: string
          type?: string
          status?: 'Ativo' | 'Inativo'
          target?: number | null
          reviewer?: string | null
          description?: string | null
          duration_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          created_by?: string | null
          header?: string
          type?: string
          status?: 'Ativo' | 'Inativo'
          target?: number | null
          reviewer?: string | null
          description?: string | null
          duration_minutes?: number
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          company_id: string
          created_by: string | null
          client_id: string | null
          service_id: string | null
          title: string
          description: string | null
          start_date: string
          end_date: string
          all_day: boolean
          color: 'sky' | 'amber' | 'violet' | 'rose' | 'emerald' | 'orange'
          location: string | null
          cliente: string | null
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          created_by?: string | null
          client_id?: string | null
          service_id?: string | null
          title: string
          description?: string | null
          start_date: string
          end_date: string
          all_day?: boolean
          color?: 'sky' | 'amber' | 'violet' | 'rose' | 'emerald' | 'orange'
          location?: string | null
          cliente?: string | null
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          created_by?: string | null
          client_id?: string | null
          service_id?: string | null
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          all_day?: boolean
          color?: 'sky' | 'amber' | 'violet' | 'rose' | 'emerald' | 'orange'
          location?: string | null
          cliente?: string | null
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      financial_movements: {
        Row: {
          id: string
          company_id: string
          created_by: string | null
          client_id: string | null
          event_id: string | null
          type: 'faturamento' | 'despesa'
          amount: number
          description: string | null
          date: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          created_by?: string | null
          client_id?: string | null
          event_id?: string | null
          type: 'faturamento' | 'despesa'
          amount: number
          description?: string | null
          date?: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          created_by?: string | null
          client_id?: string | null
          event_id?: string | null
          type?: 'faturamento' | 'despesa'
          amount?: number
          description?: string | null
          date?: string
          category?: string | null
          created_at?: string
        }
      }
      product_movements: {
        Row: {
          id: string
          company_id: string
          product_id: string
          type: 'entrada' | 'saida'
          quantidade: number
          unit_cost: number | null
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          product_id: string
          type: 'entrada' | 'saida'
          quantidade: number
          unit_cost?: number | null
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          product_id?: string
          type?: 'entrada' | 'saida'
          quantidade?: number
          unit_cost?: number | null
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      service_materials: {
        Row: {
          id: string
          company_id: string
          service_id: string
          product_id: string
          quantidade: number
          unit_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          service_id: string
          product_id: string
          quantidade: number
          unit_cost?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          service_id?: string
          product_id?: string
          quantidade?: number
          unit_cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      company_plans: {
        Row: {
          company_id: string
          plan: 'free' | 'plus' | 'pro'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          status: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete_expired'
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          plan?: 'free' | 'plus' | 'pro'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete_expired'
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          plan?: 'free' | 'plus' | 'pro'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          status?: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing' | 'unpaid' | 'incomplete_expired'
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          company_id: string
          user_id: string
          total_clientes: number
          clientes_vip: number
          clientes_novos: number
          produtos_estoque: number
          faturamento_total: number
          faturamento_mensal: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Tipos auxiliares baseados na nova estrutura
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyMember = Database['public']['Tables']['company_members']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ProductCategory = Database['public']['Tables']['product_categories']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type FinancialMovement = Database['public']['Tables']['financial_movements']['Row']
export type DashboardStats = Database['public']['Views']['dashboard_stats']['Row']

// Tipos para inserção
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyMemberInsert = Database['public']['Tables']['company_members']['Insert']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ProductCategoryInsert = Database['public']['Tables']['product_categories']['Insert']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type FinancialMovementInsert = Database['public']['Tables']['financial_movements']['Insert']

// Tipos para atualização
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
export type CompanyMemberUpdate = Database['public']['Tables']['company_members']['Update']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type ProductCategoryUpdate = Database['public']['Tables']['product_categories']['Update']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']
export type EventUpdate = Database['public']['Tables']['events']['Update']
export type FinancialMovementUpdate = Database['public']['Tables']['financial_movements']['Update']
export type ServiceMaterial = Database['public']['Tables']['service_materials']['Row']
export type ProductMovement = Database['public']['Tables']['product_movements']['Row']
export type CompanyPlan = Database['public']['Tables']['company_plans']['Row']
export type CompanyPlanInsert = Database['public']['Tables']['company_plans']['Insert']
export type CompanyPlanUpdate = Database['public']['Tables']['company_plans']['Update']