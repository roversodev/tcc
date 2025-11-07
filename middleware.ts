import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Verificar se as variáveis de ambiente estão configuradas
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured. Skipping auth middleware.')
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Verificar se o usuário está autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Rotas protegidas - requer autenticação
    const protectedRoutes = ['/agenda', '/clientes', '/estoque', '/dashboard', '/servicos']
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )

    // Rotas de autenticação - redirecionar se já autenticado
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
    const isAuthRoute = authRoutes.some(route => 
      pathname.startsWith(route)
    )

    // Permitir acesso à página inicial (/) sempre
    if (pathname === '/') {
      return supabaseResponse
    }

    // Se não está autenticado e tenta acessar rota protegida
    if (!user && isProtectedRoute) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Se está autenticado
    if (user) {
      // Se tenta acessar rota de auth (exceto onboarding e reset-password), redirecionar para dashboard
      if (isAuthRoute && !pathname.startsWith('/reset-password')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }

      // Verificar status do onboarding e empresa para rotas protegidas
      if (isProtectedRoute || pathname === '/dashboard') {
        try {
          // Buscar perfil do usuário
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed, current_company_id')
            .eq('id', user.id)
            .single()

          if (profileError) throw profileError

          // Se o onboarding não foi completado, redirecionar para onboarding
          if (!profile.onboarding_completed) {
            if (!pathname.startsWith('/onboarding')) {
              const redirectUrl = request.nextUrl.clone()
              redirectUrl.pathname = '/onboarding'
              return NextResponse.redirect(redirectUrl)
            }
          }

          // Se não tem empresa atual, verificar se tem alguma empresa
          if (!profile.current_company_id) {
            const { data: companies, error: companiesError } = await supabase
              .from('company_members')
              .select('company_id')
              .eq('user_id', user.id)
              .limit(1)

            if (companiesError) throw companiesError

            // Se não tem nenhuma empresa, redirecionar para onboarding
            if (!companies || companies.length === 0) {
              if (!pathname.startsWith('/onboarding')) {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/onboarding'
                return NextResponse.redirect(redirectUrl)
              }
            }
          }
        } catch (error) {
          console.error('Error checking user status:', error)
          // Em caso de erro, redirecionar para onboarding por segurança
          if (!pathname.startsWith('/onboarding')) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/onboarding'
            return NextResponse.redirect(redirectUrl)
          }
        }
      }

      // ADICIONADO: bloquear dashboard para membros
      if (pathname.startsWith('/dashboard')) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // obter empresa atual do perfil
            const { data: profile } = await supabase
              .from('profiles')
              .select('current_company_id')
              .eq('id', user.id)
              .maybeSingle()

            const currentCompanyId = profile?.current_company_id
            if (currentCompanyId) {
              const { data: membership } = await supabase
                .from('company_members')
                .select('role')
                .eq('company_id', currentCompanyId)
                .eq('user_id', user.id)
                .maybeSingle()

              if (membership?.role === 'member') {
                const redirectUrl = request.nextUrl.clone()
                redirectUrl.pathname = '/agenda'
                return NextResponse.redirect(redirectUrl)
              }
            }
          }
        } catch (err) {
          console.error('Error checking dashboard access:', err)
        }
      }
      // Se está na página de onboarding mas já completou o onboarding e tem empresa
      if (pathname.startsWith('/onboarding')) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed, current_company_id')
            .eq('id', user.id)
            .single()

          if (!profileError && profile.onboarding_completed && profile.current_company_id) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/dashboard'
            return NextResponse.redirect(redirectUrl)
          }
        } catch (error) {
          console.error('Error checking user status in onboarding:', error)
        }
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error('Error in middleware:', error)
    // Em caso de erro, permitir acesso sem redirecionamento
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (optional, if you want to protect API routes differently)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}