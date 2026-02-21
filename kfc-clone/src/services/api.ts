const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Получаем CSRF токен из cookies
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export interface ApiProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const api = {
  async getProducts(): Promise<ApiProduct[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Обработка пагинации DRF
      if (data.results) {
        return data.results;
      }
      // Если это массив напрямую
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getProduct(id: number): Promise<ApiProduct> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    return response.json();
  },

  async createProduct(product: Omit<ApiProduct, 'id' | 'created_at' | 'updated_at' | 'image_url'>, imageFile?: File): Promise<ApiProduct> {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('price', product.price);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    const response = await fetch(`${API_BASE_URL}/products/`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to create product');
    }
    return response.json();
  },

  async updateProduct(id: number, product: Partial<ApiProduct>, imageFile?: File): Promise<ApiProduct> {
    const formData = new FormData();
    if (product.name) formData.append('name', product.name);
    if (product.description) formData.append('description', product.description);
    if (product.price) formData.append('price', product.price);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers,
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'Failed to update product');
    }
    return response.json();
  },
  
  async uploadProductImage(productId: number, imageFile: File): Promise<ApiProduct> {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_BASE_URL}/products/${productId}/`, {
      method: 'PATCH',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    return response.json();
  },

  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
  },
};

export interface UserProfile {
  id: number;
  name: string;
  phone: string;
  address: string;
  photo: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export const profileApi = {
  async getProfileByPhone(phone: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/profiles/by_phone/?phone=${encodeURIComponent(phone)}`, {
        credentials: 'include',
      });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    } catch (error) {
      console.error('Profile API Error:', error);
      return null;
    }
  },
};

export interface User {
  id: number;
  username: string;
  email: string;
  profile: UserProfile;
  is_superuser: boolean;
}

export interface AuthResponse {
  user: User;
  message: string;
}

export interface NewItem {
  id: number;
  title: string;
  description: string | null;
  background_image: string | null;
  background_image_url: string | null;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const newItemsApi = {
  async getNewItems(): Promise<NewItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/new-items/`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Обработка пагинации DRF
      if (data.results) {
        return data.results;
      }
      // Если это массив напрямую
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.error('New Items API Error:', error);
      return [];
    }
  },
};

export interface EditableContent {
  id: number;
  key: string;
  content: string;
  page: string | null;
  created_at: string;
  updated_at: string;
}

export const editableContentApi = {
  async getByKey(key: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/editable-content/by_key/?key=${encodeURIComponent(key)}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        return '';
      }
      const data = await response.json();
      return data.content || '';
    } catch (error) {
      console.error('EditableContent API Error:', error);
      return '';
    }
  },

  async save(key: string, content: string, page?: string): Promise<EditableContent> {
    const response = await fetch(`${API_BASE_URL}/editable-content/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ key, content, page }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'Failed to save content');
    }
    return response.json();
  },
};

export const authApi = {
  async register(data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    name: string;
    phone: string;
    address?: string;
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || JSON.stringify(errorData));
    }
    return response.json();
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || JSON.stringify(errorData));
    }
    return response.json();
  },

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to logout');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me/`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to get current user');
      }
      return response.json();
    } catch (error) {
      console.error('Auth API Error:', error);
      return null;
    }
  },
};

