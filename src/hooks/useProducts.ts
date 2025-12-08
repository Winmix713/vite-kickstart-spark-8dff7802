import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/productService'

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
}

// Hooks for products
export const useAllProducts = () => {
  return useQuery({
    queryKey: productKeys.list('all'),
    queryFn: productService.getAllProducts,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useProductsByCategory = (category: string) => {
  return useQuery({
    queryKey: productKeys.list(`category-${category}`),
    queryFn: () => productService.getProductsByCategory(category),
    enabled: !!category,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  })
}

export const useFeaturedProducts = (limit = 10) => {
  return useQuery({
    queryKey: productKeys.list(`featured-${limit}`),
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}