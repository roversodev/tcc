import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database, ProfileInsert, CompanyInsert, CompanyMemberInsert } from '@/lib/database.types'

const supabase = createClientComponentClient<Database>()

export interface OnboardingData {
  profile: {
    firstName: string
    lastName: string
    phone: string
  }
  company: {
    name: string
    cnpj: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    website?: string
  }
}

export async function completeOnboarding(data: OnboardingData) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // 1. Atualizar perfil do usuário
    const profileData: ProfileInsert = {
      id: user.id,
      full_name: `${data.profile.firstName} ${data.profile.lastName}`,
      phone: data.profile.phone,
      onboarding_completed: true
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData)

    if (profileError) {
      throw new Error(`Erro ao atualizar perfil: ${profileError.message}`)
    }

    // 2. Criar empresa
    const companyData: CompanyInsert = {
      owner_id: user.id,
      name: data.company.name,
      cnpj: data.company.cnpj,
      email: data.company.email,
      phone: data.company.phone,
      address: data.company.address,
      city: data.company.city,
      state: data.company.state,
      zip_code: data.company.zipCode,
      country: data.company.country || 'Brasil',
      website: data.company.website
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single()

    if (companyError) {
      throw new Error(`Erro ao criar empresa: ${companyError.message}`)
    }

    // 3. Adicionar usuário como owner da empresa
    const memberData: CompanyMemberInsert = {
      company_id: company.id,
      user_id: user.id,
      role: 'owner'
    }

    const { error: memberError } = await supabase
      .from('company_members')
      .insert(memberData)

    if (memberError) {
      throw new Error(`Erro ao adicionar membro: ${memberError.message}`)
    }

    // 4. Atualizar perfil com a empresa atual
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ current_company_id: company.id })
      .eq('id', user.id)

    if (updateProfileError) {
      throw new Error(`Erro ao atualizar empresa atual: ${updateProfileError.message}`)
    }

    // 5. Criar categorias padrão de produtos para a empresa
    const defaultCategories = [
      { name: 'Produtos de Beleza', description: 'Produtos para cuidados com a beleza' },
      { name: 'Equipamentos', description: 'Equipamentos e ferramentas' },
      { name: 'Consumíveis', description: 'Produtos de consumo regular' }
    ]

    const categoriesData = defaultCategories.map(cat => ({
      company_id: company.id,
      name: cat.name,
      description: cat.description
    }))

    const { error: categoriesError } = await supabase
      .from('product_categories')
      .insert(categoriesData)

    if (categoriesError) {
      console.warn('Erro ao criar categorias padrão:', categoriesError.message)
    }

    return { success: true, company }
  } catch (error) {
    console.error('Erro no onboarding:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }
  }
}

export async function getUserProfile() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return { user: null, profile: null, company: null }
    }

    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
    }

    // Buscar empresa do usuário
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', user.id)
      .single()

    if (companyError && companyError.code !== 'PGRST116') {
      console.error('Erro ao buscar empresa:', companyError)
    }

    return { user, profile, company }
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error)
    return { user: null, profile: null, company: null }
  }
}

export async function checkOnboardingStatus() {
  try {
    const { profile, company } = await getUserProfile()
    
    if (!profile) {
      return { needsOnboarding: true, step: 'profile' }
    }

    if (!profile.onboarding_completed || !company) {
      return { needsOnboarding: true, step: 'company' }
    }

    return { needsOnboarding: false, step: null }
  } catch (error) {
    console.error('Erro ao verificar status do onboarding:', error)
    return { needsOnboarding: true, step: 'profile' }
  }
}