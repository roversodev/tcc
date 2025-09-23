"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAppContext } from "@/lib/contexts/app-context"

export function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { refreshData } = useAppContext()
  const supabase = createClient()

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: ""
  })

  const [companyData, setCompanyData] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
    website: ""
  })

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          console.error('Erro ao obter usuário:', error)
          router.push('/login')
          return
        }
        
        if (user) {
          console.log('Usuário encontrado:', user.id)
          setUser(user)
          // Pre-fill with user metadata if available
          if (user.user_metadata) {
            setProfileData(prev => ({
              ...prev,
              firstName: user.user_metadata.first_name || "",
              lastName: user.user_metadata.last_name || ""
            }))
          }
        } else {
          console.log('Nenhum usuário encontrado, redirecionando para login')
          router.push('/login')
        }
      } catch (err) {
        console.error('Erro no useEffect:', err)
        router.push('/login')
      }
    }
    getUser()
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log('Iniciando criação do perfil para usuário:', user.id)
      
      // Create or update user profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          phone: profileData.phone
        })

      if (error) {
        console.error('Erro ao criar perfil:', error)
        setError(error.message)
        return
      }

      console.log('Perfil criado com sucesso')
      setStep(2)
    } catch (err) {
      console.error('Erro inesperado no perfil:', err)
      setError('Erro inesperado ao criar perfil. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log('Iniciando criação da empresa para usuário:', user.id)
      
      // Usar a função RPC existente create_company_with_owner
      const { data: companyId, error: rpcError } = await supabase.rpc('create_company_with_owner', {
        company_name: companyData.name,
        owner_user_id: user.id,
        company_data: {
          cnpj: companyData.cnpj || null,
          email: companyData.email || null,
          phone: companyData.phone || null,
          address: companyData.address || null,
          city: companyData.city || null,
          state: companyData.state || null,
          zip_code: companyData.zipCode || null,
          website: companyData.website || null
        }
      })

      if (rpcError) {
        console.error('Erro ao criar empresa via RPC:', rpcError)
        setError(`Erro ao criar empresa: ${rpcError.message}`)
        return
      }

      console.log('Empresa criada com sucesso:', companyId)
      
      // Aguardar um pouco para garantir que tudo foi processado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Atualizar dados do contexto
      await refreshData()
      
      // Redirecionar para dashboard
      router.push('/dashboard')
      
    } catch (err) {
      console.error('Erro inesperado na empresa:', err)
      setError('Erro inesperado ao criar empresa. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full">
                <User className="size-6" />
              </div>
            </div>
            <CardTitle>Bem-vindo!</CardTitle>
            <CardDescription>
              Vamos começar configurando seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-full">
              <Building2 className="size-6" />
            </div>
          </div>
          <CardTitle>Criar sua empresa</CardTitle>
          <CardDescription>
            Agora vamos configurar os dados da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document">CNPJ/CPF</Label>
                <Input
                  id="document"
                  value={companyData.cnpj}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, cnpj: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email da Empresa</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyData.email}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Telefone da Empresa</Label>
              <Input
                id="companyPhone"
                type="tel"
                value={companyData.phone}
                onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={companyData.address}
                onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={companyData.city}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={companyData.state}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, state: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={companyData.zipCode}
                  onChange={(e) => setCompanyData(prev => ({ ...prev, zipCode: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={companyData.country}
                onChange={(e) => setCompanyData(prev => ({ ...prev, country: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (opcional)</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.exemplo.com"
                value={companyData.website}
                onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalizar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}