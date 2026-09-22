/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'customer' | 'moderator' | 'admin';

export type UserApprovalStatus = 'approved' | 'pending' | 'rejected';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  phone?: string;
  password?: string;
  approvalStatus?: UserApprovalStatus;
  isBanned?: boolean;
  isVerified?: boolean;
  address?: ShippingAddress;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl: string;
  linkCategory?: string;
  buttonText?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  itemCount?: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  stockQuantity: number;
  sku: string;
  categoryId: string;
  images: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  rating: number;
  reviewsCount: number;
  brand: string;
  features?: string[];
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  productTitle: string;
  productImage: string;
  sku?: string;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  paymentMethod: 'card' | 'paypal' | 'cod';
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

export type ViewMode = 
  | 'store'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'dashboard'
  | 'schema-docs';

export type DashboardTab = 
  | 'analytics' 
  | 'products' 
  | 'orders' 
  | 'users' 
  | 'categories' 
  | 'banners'
  | 'docs';
