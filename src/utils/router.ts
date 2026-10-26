/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ViewMode, DashboardTab } from '../types';

export interface ParsedRoute {
  viewMode: ViewMode;
  productId: string | null;
  dashboardTab: DashboardTab | null;
  searchQuery?: string;
  category?: string;
}

/**
 * Parses the current browser URL (path, hash, query) into app route state.
 */
export function parseRouteFromLocation(): ParsedRoute {
  if (typeof window === 'undefined') {
    return {
      viewMode: 'store',
      productId: null,
      dashboardTab: null,
    };
  }

  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Direct query param fallback (e.g. ?product=id or ?view=contact)
  const queryProduct = searchParams.get('product');
  if (queryProduct) {
    return {
      viewMode: 'product-detail',
      productId: queryProduct,
      dashboardTab: null,
    };
  }

  // 2. Product Detail Route: /product/:idOrSlug
  if (pathname.startsWith('/product/') || pathname.startsWith('/products/')) {
    const rawParam = pathname.replace(/^\/products?\//, '');
    const cleanIdOrSlug = decodeURIComponent(rawParam.split('/')[0] || '').trim();
    if (cleanIdOrSlug) {
      return {
        viewMode: 'product-detail',
        productId: cleanIdOrSlug,
        dashboardTab: null,
      };
    }
  }

  // 3. Contact Route: /contact or /support
  if (pathname === '/contact' || pathname === '/support' || pathname === '/contact-us') {
    return {
      viewMode: 'contact',
      productId: null,
      dashboardTab: null,
    };
  }

  // 4. Checkout Route: /checkout
  if (pathname === '/checkout') {
    return {
      viewMode: 'checkout',
      productId: null,
      dashboardTab: null,
    };
  }

  // 5. Orders Route: /orders or /my-orders
  if (pathname === '/orders' || pathname === '/my-orders' || pathname === '/order-history') {
    return {
      viewMode: 'orders',
      productId: null,
      dashboardTab: null,
    };
  }

  // 6. Dashboard Route: /dashboard or /dashboard/:tab
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const rawTab = pathname.replace(/^\/dashboard\/?/, '').split('/')[0];
    const validTabs: DashboardTab[] = [
      'analytics',
      'products',
      'orders',
      'users',
      'categories',
      'banners',
      'importer',
      'database',
      'docs',
    ];
    const resolvedTab = (validTabs.includes(rawTab as DashboardTab) ? rawTab : 'products') as DashboardTab;
    return {
      viewMode: 'dashboard',
      productId: null,
      dashboardTab: resolvedTab,
    };
  }

  // 7. Architecture & Schema Docs Route: /schema-docs or /docs
  if (pathname === '/schema-docs' || pathname === '/architecture') {
    return {
      viewMode: 'schema-docs',
      productId: null,
      dashboardTab: null,
    };
  }

  // 8. Default Storefront Home: /
  return {
    viewMode: 'store',
    productId: null,
    dashboardTab: null,
    searchQuery: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
  };
}

/**
 * Builds canonical URL string for any application view
 */
export function buildUrlForRoute(
  viewMode: ViewMode,
  options?: {
    productId?: string | null;
    slug?: string | null;
    dashboardTab?: DashboardTab | null;
  }
): string {
  switch (viewMode) {
    case 'product-detail': {
      const identifier = options?.slug || options?.productId;
      return identifier ? `/product/${encodeURIComponent(identifier)}` : '/';
    }
    case 'contact':
      return '/contact';
    case 'checkout':
      return '/checkout';
    case 'orders':
      return '/orders';
    case 'dashboard':
      return options?.dashboardTab && options.dashboardTab !== 'products'
        ? `/dashboard/${options.dashboardTab}`
        : '/dashboard';
    case 'schema-docs':
      return '/schema-docs';
    case 'store':
    default:
      return '/';
  }
}

/**
 * Updates browser URL history and title without triggering full page reload
 */
export function syncBrowserUrl(
  viewMode: ViewMode,
  options?: {
    productId?: string | null;
    slug?: string | null;
    dashboardTab?: DashboardTab | null;
    pageTitle?: string;
    replace?: boolean;
  }
): void {
  if (typeof window === 'undefined') return;

  const targetUrl = buildUrlForRoute(viewMode, options);
  const currentPath = window.location.pathname;

  // Avoid pushing duplicate entries to history
  if (currentPath !== targetUrl) {
    if (options?.replace) {
      window.history.replaceState({ viewMode, ...options }, '', targetUrl);
    } else {
      window.history.pushState({ viewMode, ...options }, '', targetUrl);
    }
  }

  // Update dynamic page title
  if (options?.pageTitle) {
    document.title = `${options.pageTitle} | XEEROO`;
  } else {
    switch (viewMode) {
      case 'product-detail':
        document.title = 'Product Details | XEEROO';
        break;
      case 'contact':
        document.title = 'Contact Us & Direct Support | XEEROO';
        break;
      case 'checkout':
        document.title = 'Secure Checkout | XEEROO';
        break;
      case 'orders':
        document.title = 'Order History & Invoices | XEEROO';
        break;
      case 'dashboard':
        document.title = 'Admin Management Dashboard | XEEROO';
        break;
      case 'schema-docs':
        document.title = 'System Architecture & Schema | XEEROO';
        break;
      case 'store':
      default:
        document.title = 'XEEROO | Premium Gadgets, Hardware & Tech Bangladesh';
        break;
    }
  }
}
