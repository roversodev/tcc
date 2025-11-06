"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppContext } from '@/lib/contexts/app-context'
import { Product, ProductCategory, ProductInsert, ProductUpdate, ProductMovement } from '@/lib/database.types'

export function useProducts() {
  const { currentCompany, user } = useAppContext()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [movements, setMovements] = useState<ProductMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  // Buscar produtos
  const fetchProducts = async () => {
    if (!currentCompany?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_categories (
            id,
            name
          )
        `)
        .eq('company_id', currentCompany.id)
        .order('nome')

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Erro ao buscar produtos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Buscar categorias
  const fetchCategories = async () => {
    if (!currentCompany?.id) return

    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('name')

      console.log('categorias', data)

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao buscar categorias:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  // Buscar movimentações (com join do produto)
  const fetchMovements = async () => {
    if (!currentCompany?.id) return
    try {
      setMovementsLoading(true)
      const { data, error } = await supabase
        .from('product_movements')
        .select(`
          *,
          products:product_id (
            id,
            nome,
            unidade
          )
        `)
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMovements(data || [])
    } catch (err) {
      console.error('Erro ao buscar movimentações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setMovementsLoading(false)
    }
  }

  // Criar produto
  const createProduct = async (productData: Omit<ProductInsert, 'company_id' | 'created_by'>) => {
    if (!currentCompany?.id || !user?.id) {
      throw new Error('Empresa ou usuário não encontrado')
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          company_id: currentCompany.id,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      
      await fetchProducts() // Recarregar lista
      return data
    } catch (err) {
      console.error('Erro ao criar produto:', err)
      throw err
    }
  }

  // Atualizar produto
  const updateProduct = async (id: string, productData: ProductUpdate) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .eq('company_id', currentCompany?.id)
        .select()
        .single()

      if (error) throw error
      
      await fetchProducts() // Recarregar lista
      return data
    } catch (err) {
      console.error('Erro ao atualizar produto:', err)
      throw err
    }
  }

  // Deletar produto
  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('company_id', currentCompany?.id)

      if (error) throw error
      
      await fetchProducts() // Recarregar lista
    } catch (err) {
      console.error('Erro ao deletar produto:', err)
      throw err
    }
  }

  // Criar categoria
  const createCategory = async (name: string, description?: string) => {
    if (!currentCompany?.id) {
      throw new Error('Empresa não encontrada')
    }

    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert({
          company_id: currentCompany.id,
          name,
          description,
        })
        .select()
        .single()

      if (error) throw error
      
      await fetchCategories() // Recarregar lista
      return data
    } catch (err) {
      console.error('Erro ao criar categoria:', err)
      throw err
    }
  }

  // Atualizar estoque
  const updateStock = async (id: string, quantidade: number) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({ 
          quantidade,
          data_ultima_entrada: new Date().toISOString(),
          status: quantidade <= 0 ? 'Estoque Baixo' : 'Ativo'
        })
        .eq('id', id)
        .eq('company_id', currentCompany?.id)
        .select()
        .single()

      if (error) throw error
      
      await fetchProducts() // Recarregar lista
      return data
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err)
      throw err
    }
  }

  // NOVO: criar movimentação de estoque (entrada/saída) com custo médio ponderado
  const createMovement = async (args: {
    product_id: string
    type: 'entrada' | 'saida'
    quantidade: number
    unit_cost?: number | null
    note?: string
  }) => {
    const { product_id, type, quantidade, unit_cost = null, note } = args
    if (!currentCompany?.id || !user?.id) {
      throw new Error('Empresa ou usuário não encontrado')
    }

    // Buscar produto atual (quantidade e custo)
    const { data: prod, error: pErr } = await supabase
      .from('products')
      .select('id, quantidade, cost_price')
      .eq('id', product_id)
      .eq('company_id', currentCompany.id)
      .single()
    if (pErr) throw pErr

    const currentQty = prod.quantidade ?? 0
    const currentCost = prod.cost_price ?? 0

    let newQty = currentQty
    let newAvgCost = currentCost

    if (type === 'entrada') {
      const incomingCost = Number(unit_cost ?? 0)
      newQty = currentQty + quantidade
      // custo médio ponderado
      newAvgCost = newQty > 0
        ? ((currentQty * currentCost) + (quantidade * incomingCost)) / newQty
        : incomingCost
    } else {
      if (quantidade > currentQty) {
        throw new Error('Quantidade de saída maior que o estoque atual')
      }
      newQty = currentQty - quantidade
      // saída não altera custo médio
    }

    // Inserir movimentação
    const { error: mErr } = await supabase
      .from('product_movements')
      .insert({
        company_id: currentCompany.id,
        product_id,
        type,
        quantidade,
        unit_cost: type === 'entrada' ? Number(unit_cost ?? 0) : currentCost,
        note,
        created_by: user.id,
      })
    if (mErr) throw mErr

    // Atualizar produto: quantidade e custo médio; data_ultima_entrada apenas em entrada
    const updatePayload: any = {
      quantidade: newQty,
      cost_price: newAvgCost,
      status: newQty <= 0 ? 'Estoque Baixo' : 'Ativo',
    }
    if (type === 'entrada') {
      updatePayload.data_ultima_entrada = new Date().toISOString()
    }

    const { error: uErr } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', product_id)
      .eq('company_id', currentCompany.id)
    if (uErr) throw uErr

    await fetchProducts()
  }

  // Produtos com estoque baixo
  const lowStockProducts = products.filter(product => 
    product.quantidade <= product.estoque_minimo
  )

  // Valor total do estoque
  const totalStockValue = products.reduce((total, product) => 
    total + (product.preco || 0) * product.quantidade, 0
  )

  // Carregar dados iniciais
  useEffect(() => {
    if (currentCompany?.id) {
      fetchProducts()
      fetchCategories()
      fetchMovements()
    }
  }, [currentCompany?.id])

  return {
    products,
    categories,
    loading,
    error,
    lowStockProducts,
    totalStockValue,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    createCategory,
    updateStock,
    // NOVO
    createMovement,
    movements,
    movementsLoading,
    fetchMovements,
  }
}