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
 * Normalizes raw route string from hash, path, or query
 */
function cleanRouteSegment(str: string): string {
  return str.replace(/^[#/]+/, '').replace(/\/+$/, '').trim();
}

/**
 * Parses the current browser URL (hash, path, query) into app route state.
 * Supports Hash routing (#/product/..., #/contact, etc.) as primary format
 * to prevent 404 "This page doesn't exist" errors on browser refresh in Cloud Run & preview environments,
 * while maintaining backward compatibility with path (/product/...) and query (?product=...).
 */
export function parseRouteFromLocation(): ParsedRoute {
  if (typeof window === 'undefined') {
    return {
      viewMode: 'store',
      productId: null,
      dashboardTab: null,
    };
  }

  const hash = window.location.hash || '';
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

  const queryView = searchParams.get('view');
  if (queryView) {
    if (queryView === 'contact') return { viewMode: 'contact', productId: null, dashboardTab: null };
    if (queryView === 'checkout') return { viewMode: 'checkout', productId: null, dashboardTab: null };
    if (queryView === 'orders') return { viewMode: 'orders', productId: null, dashboardTab: null };
    if (queryView === 'dashboard') {
      const tab = (searchParams.get('tab') as DashboardTab) || 'products';
      return { viewMode: 'dashboard', productId: null, dashboardTab: tab };
    }
  }

  // 2. Hash Routing (#/product/..., #/contact, #/orders, etc.)
  if (hash) {
    // Handle both '#/product/xyz' and '#product=xyz'
    if (hash.startsWith('#product=') || hash.startsWith('#/product=') || hash.startsWith('#/products=')) {
      const raw = hash.replace(/^#\/?products?=/, '');
      const cleanId = decodeURIComponent(raw.split('&')[0] || '').trim();
      if (cleanId) {
        return { viewMode: 'product-detail', productId: cleanId, dashboardTab: null };
      }
    }

    const cleanHash = cleanRouteSegment(hash.toLowerCase());

    if (cleanHash.startsWith('product/') || cleanHash.startsWith('products/')) {
      const rawParam = cleanHash.replace(/^products?\//, '');
      const cleanIdOrSlug = decodeURIComponent(rawParam.split('/')[0] || '').trim();
      if (cleanIdOrSlug) {
        return { viewMode: 'product-detail', productId: cleanIdOrSlug, dashboardTab: null };
      }
    }

    if (cleanHash === 'contact' || cleanHash === 'support' || cleanHash === 'contact-us') {
      return { viewMode: 'contact', productId: null, dashboardTab: null };
    }

    if (cleanHash === 'checkout') {
      return { viewMode: 'checkout', productId: null, dashboardTab: null };
    }

    if (cleanHash === 'orders' || cleanHash === 'my-orders' || cleanHash === 'order-history') {
      return { viewMode: 'orders', productId: null, dashboardTab: null };
    }

    if (cleanHash === 'dashboard' || cleanHash.startsWith('dashboard/')) {
      const rawTab = cleanHash.replace(/^dashboard\/?/, '').split('/')[0];
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
      return { viewMode: 'dashboard', productId: null, dashboardTab: resolvedTab };
    }

    if (cleanHash === 'schema-docs' || cleanHash === 'architecture' || cleanHash === 'docs') {
      return { viewMode: 'schema-docs', productId: null, dashboardTab: null };
    }
  }

  // 3. Path Routing fallback (if URL was loaded via pathname like /product/:id)
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

  if (pathname === '/contact' || pathname === '/support' || pathname === '/contact-us') {
    return {
      viewMode: 'contact',
      productId: null,
      dashboardTab: null,
    };
  }

  if (pathname === '/checkout') {
    return {
      viewMode: 'checkout',
      productId: null,
      dashboardTab: null,
    };
  }

  if (pathname === '/orders' || pathname === '/my-orders' || pathname === '/order-history') {
    return {
      viewMode: 'orders',
      productId: null,
      dashboardTab: null,
    };
  }

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

  if (pathname === '/schema-docs' || pathname === '/architecture') {
    return {
      viewMode: 'schema-docs',
      productId: null,
      dashboardTab: null,
    };
  }

  // 4. Default Storefront Home
  return {
    viewMode: 'store',
    productId: null,
    dashboardTab: null,
    searchQuery: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
  };
}

/**
 * Builds canonical URL string for any application view using safe Hash Routing
 * (e.g. /#/product/xyz, /#/contact, /#/orders, /#/)
 * This guarantees browser refresh NEVER hits a 404 "This page doesn't exist" in Cloud Run / hosting.
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
      return identifier ? `/#/product/${encodeURIComponent(identifier)}` : '/#/';
    }
    case 'contact':
      return '/#/contact';
    case 'checkout':
      return '/#/checkout';
    case 'orders':
      return '/#/orders';
    case 'dashboard':
      return options?.dashboardTab && options.dashboardTab !== 'products'
        ? `/#/dashboard/${options.dashboardTab}`
        : '/#/dashboard';
    case 'schema-docs':
      return '/#/schema-docs';
    case 'store':
    default:
      return '/#/';
  }
}

/**
 * Updates browser URL history and title without triggering full page reload.
 * Normalizes pathname back to root '/' with the hash '#/...' so that
 * when the user presses Refresh (F5), the browser requests '/' and loads cleanly.
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

  // Normalize path: If current pathname is not '/' (e.g. user refreshed on /product/123),
  // replace with root path and the hash so future refreshes always hit '/'
  const currentFull = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const targetFull = `${window.location.pathname === '/' ? '' : '/'}${targetUrl.replace(/^\/+/, '')}`;

  if (currentFull !== targetFull && (window.location.hash !== targetUrl.replace(/^\//, ''))) {
    if (options?.replace || window.location.pathname !== '/') {
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
