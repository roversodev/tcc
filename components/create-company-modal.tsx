"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Building2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Database } from "@/lib/database.types"
import { useAppContext } from "@/lib/contexts/app-context"

const companySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(1, "CNPJ/CPF é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zip_code: z.string().min(1, "CEP é obrigatório"),
  country: z.string().min(1, "País é obrigatório"),
  website: z.string().optional(),
})

type CompanyFormData = z.infer<typeof companySchema>

interface CreateCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCompanyModal({ open, onOpenChange }: CreateCompanyModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const { user, refreshData } = useAppContext()

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "Brasil",
      website: "",
    },
  })

  const onSubmit = async (data: CompanyFormData) => {
    if (!user) return

    setIsLoading(true)
    const loadingToast = toast.loading("Criando empresa...")

    try {
      // Criar empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          cnpj: data.cnpj || null,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip_code: data.zip_code || null,
          country: data.country || null,
          website: data.website || null,
        })
        .select()
        .single()

      if (companyError) throw companyError

      // Adicionar usuário à empresa como admin
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          user_id: user.id,
          company_id: company.id,
          role: 'admin'
        })

      if (memberError) throw memberError

      // Atualizar perfil do usuário com a nova empresa como atual
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          current_company_id: company.id
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Criar categorias padrão de produtos
      const defaultCategories = [
        { name: 'Produtos', description: 'Categoria padrão para produtos' },
        { name: 'Serviços', description: 'Categoria padrão para serviços' }
      ]

      const { error: categoriesError } = await supabase
        .from('product_categories')
        .insert(
          defaultCategories.map(category => ({
            ...category,
            company_id: company.id
          }))
        )

      if (categoriesError) {
        console.warn('Erro ao criar categorias padrão:', categoriesError)
      }

      // Atualizar contexto da aplicação
      await refreshData()
      
      toast.dismiss(loadingToast)
      toast.success("Empresa criada com sucesso!")
      
      // Fechar modal e resetar formulário
      onOpenChange(false)
      form.reset()
      
      // Redirecionar para dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.dismiss(loadingToast)
      toast.error(error.message || "Erro ao criar empresa")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg">
              <Building2 className="size-5" />
            </div>
            <div>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
              <DialogDescription>
                Preencha os dados da sua nova empresa
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ/CPF *</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="empresa@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Endereço *</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, complemento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input placeholder="São Paulo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                      <Input placeholder="SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zip_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP *</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País *</FormLabel>
                    <FormControl>
                      <Input placeholder="Brasil" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Empresa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}