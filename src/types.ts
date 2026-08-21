export interface User {
  id: number
  name: string
  email: string
  phone: string
  avatar: string
  city: string
  status: number
  createdAt: string
}

export interface News {
  id: number
  title: string
  summary: string
  content: string
  author: string
  categoryId: number
  views: number
  createdAt: string
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
