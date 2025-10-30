"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import InputSenhaForte from "@/components/InputSenhaForte"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número"),
  confirmPassword: z
    .string()
    .min(1, "Confirmação de senha é obrigatória")
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

function ResetPasswordFormContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [isCheckingToken, setIsCheckingToken] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword } = useAuth()
  const supabase = createClient()

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  // Verificar token ao carregar o componente
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Verificar se há parâmetros de hash na URL (formato do Supabase)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (type === 'recovery' && accessToken && refreshToken) {
          // Definir a sessão com os tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Erro ao definir sessão:', error)
            setIsValidToken(false)
          } else {
            setIsValidToken(true)
          }
        } else {
          // Verificar se já existe uma sessão válida
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error || !session) {
            setIsValidToken(false)
          } else {
            setIsValidToken(true)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error)
        setIsValidToken(false)
      } finally {
        setIsCheckingToken(false)
      }
    }

    checkToken()
  }, [supabase.auth])

  // Função para lidar com o submit do formulário
  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await updatePassword(data.password)
      
      if (error) {
        toast.error(error.message || "Erro ao atualizar senha")
        return
      }

      setPasswordReset(true)
      toast.success("Senha atualizada com sucesso!")
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push("/login")
      }, 3000)
      
    } catch (error) {
      console.error('Erro ao atualizar senha:', error)
      toast.error("Erro inesperado ao atualizar senha")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando link de recuperação...</p>
        </div>
      </div>
    )
  }

  if (isValidToken === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Link Inválido ou Expirado</CardTitle>
            <CardDescription>
              O link de recuperação de senha é inválido ou já expirou. Solicite um novo link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/forgot-password")}
              className="w-full"
            >
              Solicitar Novo Link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (passwordReset) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="mt-4">Senha Atualizada!</CardTitle>
            <CardDescription>
              Sua senha foi atualizada com sucesso. Você será redirecionado para o login em alguns segundos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/login")}
              className="w-full"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Digite sua nova senha abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <InputSenhaForte
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <InputSenhaForte
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Atualizar Senha
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  )
}