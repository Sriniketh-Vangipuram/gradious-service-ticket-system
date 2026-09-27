export interface Category {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tickets: number;
  };
}

export interface CategoryListResponse {
  success: true;
  data: {
    data: Category[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CategoryResponse {
  success: true;
  data: {
    category: Category;
  };
}

export interface CreateCategoryInput {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  code?: string;
  description?: string | null;
}

export interface UpdateCategoryStatusInput {
  isActive: boolean;
}

export interface CategoryFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}