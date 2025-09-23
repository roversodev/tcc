"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppContext } from '@/lib/contexts/app-context'
import { Product, ProductCategory, ProductInsert, ProductUpdate } from '@/lib/database.types'

export function useProducts() {
  const { currentCompany, user } = useAppContext()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }
}