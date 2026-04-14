// Определяем API URL: используем относительный путь в браузере
const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // В браузере - используем относительный путь (Nginx проксирует)
    return '/api';
  }
  // Для SSR
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
};

// Функция для получения API URL (всегда актуальный)
const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Используем относительный путь - это работает надежнее
    return '/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Получаем CSRF токен из cookies
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
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
      // Используем Next.js API route для проксирования
      const apiUrl = '/api/products/';
      console.log('🔄 Fetching products from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store', // Отключаем кеш
      });
      
      console.log('✅ Response received:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`❌ API Error: HTTP ${response.status} - ${response.statusText}`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const count = Array.isArray(data) ? data.length : (data.results ? data.results.length : 0);
      console.log('✅ Products loaded:', count);
      
      // Обработка пагинации DRF
      if (data.results) {
        return data.results;
      }
      // Если это массив напрямую
      if (Array.isArray(data)) {
        return data;
      }
      console.warn('⚠️ Unexpected API response format:', data);
      return [];
    } catch (error) {
      console.error('❌ API Error fetching products:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Пробрасываем ошибку, чтобы компонент мог обработать её
      throw error;
    }
  },

  async getProduct(id: number): Promise<ApiProduct> {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/products/${id}/`);
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
    
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/products/`, {
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
    
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/products/${id}/`, {
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
    
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/products/${productId}/`, {
      method: 'PATCH',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    return response.json();
  },

  async deleteProduct(id: number): Promise<void> {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/products/${id}/`, {
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
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/profiles/by_phone/?phone=${encodeURIComponent(phone)}`, {
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
      const apiUrl = '/api';
      const response = await fetch(`${apiUrl}/new-items/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        console.error(`New Items API Error: HTTP ${response.status} - ${response.statusText}`);
        return [];
      }
      const data = await response.json();
      console.log('New items loaded:', Array.isArray(data) ? data.length : (data.results ? data.results.length : 0));
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
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/editable-content/by_key/?key=${encodeURIComponent(key)}`, {
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
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/editable-content/`, {
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

export interface Order {
  id: number;
  name: string;
  phone: string;
  address: string;
  total_price: string;
  created_at: string;
  status?: string;
  items?: { id: number; name: string; quantity: number; price: string; total: string }[];
}

export const ordersApi = {
  async getMyOrders(): Promise<Order[]> {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/orders/`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      const data = await response.json();
      if (data.results) return data.results;
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      return [];
    }
  },
};

export interface AdminStats {
  total_users: number;
  total_orders: number;
}

export interface AdminOrder {
  id: number;
  name: string;
  phone: string;
  address: string;
  items: { name: string; quantity: number; price: string }[];
  total_price: string;
  status: string;
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  photo_url: string | null;
  is_superuser: boolean;
  is_active: boolean;
  orders_count: number;
  orders_sum: string;
  date_joined: string;
}

export const adminApi = {
  async getStats(): Promise<AdminStats | null> {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/auth/admin_stats/`, {
        credentials: 'include',
      });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  async getAllOrders(): Promise<{ orders: AdminOrder[]; total: number; total_sum: string; pending: number; completed: number }> {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/admin_all_orders/`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Forbidden');
    return response.json();
  },

  async getAllUsers(): Promise<{ users: AdminUser[]; total: number }> {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/admin_all_users/`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Forbidden');
    return response.json();
  },

  async updateOrderStatus(orderId: number, newStatus: string): Promise<void> {
    const csrfToken = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('csrftoken='))?.split('=')[1] || '';
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/admin_update_order_status/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ order_id: orderId, status: newStatus }),
    });
    if (!response.ok) throw new Error('Failed to update status');
  },
};

// ─── CHAT ─────────────────────────────────────────
export interface ChatMsg {
  id: number;
  message: string;
  sender: 'client' | 'admin';
  created_at: string;
  is_read: boolean;
}

export interface ChatUser {
  user_id: number;
  username: string;
  name: string;
  phone: string;
  unread: number;
  last_message: string;
  last_time: string;
  last_sender: string;
}

export const chatApi = {
  async getMyMessages(): Promise<ChatMsg[]> {
    try {
      const apiUrl = getApiUrl();
      const r = await fetch(`${apiUrl}/auth/my_chat/`, { credentials: 'include' });
      if (!r.ok) return [];
      const d = await r.json();
      return d.messages || [];
    } catch { return []; }
  },

  async sendMessage(text: string): Promise<ChatMsg | null> {
    try {
      const csrfToken = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('csrftoken='))?.split('=')[1] || '';
      const apiUrl = getApiUrl();
      const r = await fetch(`${apiUrl}/auth/my_chat/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ message: text }),
      });
      if (!r.ok) return null;
      return r.json();
    } catch { return null; }
  },

  async getUnreadCount(): Promise<number> {
    try {
      const apiUrl = getApiUrl();
      const r = await fetch(`${apiUrl}/auth/chat_unread/`, { credentials: 'include' });
      if (!r.ok) return 0;
      const d = await r.json();
      return d.count || 0;
    } catch { return 0; }
  },

  async getAdminChats(): Promise<ChatUser[]> {
    try {
      const apiUrl = getApiUrl();
      const r = await fetch(`${apiUrl}/auth/admin_chats/`, { credentials: 'include' });
      if (!r.ok) return [];
      const d = await r.json();
      return d.chats || [];
    } catch { return []; }
  },

  async getAdminChatMessages(userId: number): Promise<{ messages: ChatMsg[]; user_name: string }> {
    try {
      const apiUrl = getApiUrl();
      const r = await fetch(`${apiUrl}/auth/admin_chat_messages/?user_id=${userId}`, { credentials: 'include' });
      if (!r.ok) return { messages: [], user_name: '' };
      return r.json();
    } catch { return { messages: [], user_name: '' }; }
  },

  async adminReply(userId: number, text: string): Promise<ChatMsg | null> {
    try {
      const csrfToken = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('csrftoken='))?.split('=')[1] || '';
      const apiUrl = getApiUrl();
      const r = await fetch(`${apiUrl}/auth/admin_chat_messages/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ user_id: userId, message: text }),
      });
      if (!r.ok) return null;
      return r.json();
    } catch { return null; }
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
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/register/`, {
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
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Обработка разных форматов ошибок
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      if (errorData.detail) {
        throw new Error(errorData.detail);
      }
      if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
        throw new Error(errorData.non_field_errors[0]);
      }
      throw new Error(errorData.message || 'Ошибка при входе');
    }
    return response.json();
  },

  async logout(): Promise<void> {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to logout');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const apiUrl = '/api';
      const response = await fetch(`${apiUrl}/auth/me/`, {
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

