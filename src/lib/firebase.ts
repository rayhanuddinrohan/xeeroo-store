import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  writeBatch,
} from "firebase/firestore";
import { Product, User, Category, Order, BannerSlide } from "../types";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDqDf3Ae_JuH8b9IMwz-pJsh_EKB7hza9Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "xeeroo-store.firebaseapp.com",
  databaseURL: "https://xeeroo-store-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "xeeroo-store",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "xeeroo-store.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "751882362566",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:751882362566:web:27bdc54b01d2683a8281c7",
  measurementId: "G-0VY2GNZYR9",
};

// Initialize Firebase App, Auth, Firestore
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ==========================================
// 1. Connection Ping & Health Check
// ==========================================
export const testFirestoreConnection = async (): Promise<{
  success: boolean;
  message: string;
  latency?: number;
  projectId: string;
}> => {
  const startTime = Date.now();
  try {
    const testDocRef = doc(db, '_health', 'ping');
    await setDoc(
      testDocRef,
      {
        lastPing: new Date().toISOString(),
        client: 'XEEROO-Applet',
      },
      { merge: true }
    );
    const latency = Date.now() - startTime;
    return {
      success: true,
      message: `Database connected successfully! Latency: ${latency}ms`,
      latency,
      projectId: firebaseConfig.projectId,
    };
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string };
    console.warn("Firestore connection test ping warning:", error);
    return {
      success: false,
      message: error.message || 'Could not reach Firestore database.',
      projectId: firebaseConfig.projectId,
    };
  }
};

// ==========================================
// 2. Authentication & User Profile Sync
// ==========================================
export const sendFirebasePasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return {
      success: true,
      message: `Password reset email sent to ${email}. Please check your inbox and spam folder.`,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.warn("Firebase password reset error:", error);
    if (error.code === 'auth/user-not-found') {
      return { success: false, message: 'No registered account found with this email in Firebase.' };
    } else if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Invalid email address provided.' };
    }
    return { success: false, message: error.message || 'Failed to send password reset email.' };
  }
};

export const signInFirebaseUser = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return { success: true, user: userCredential.user };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    return { success: false, error: error.code || error.message || 'Authentication failed' };
  }
};

// Fetch User Profile from Firestore
export const fetchFirestoreUserProfile = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (err) {
    console.warn('Firestore fetch user profile error:', err);
    return null;
  }
};

// Save User/Customer to Firestore (both `users` and `customers` collections for full compatibility)
export const saveFirestoreCustomer = async (user: User): Promise<boolean> => {
  try {
    const userPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone || '',
      approvalStatus: user.approvalStatus || 'approved',
      isVerified: user.isVerified ?? true,
      isBanned: user.isBanned ?? false,
      avatarUrl: user.avatarUrl || '',
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      address: user.address || {
        fullName: user.fullName,
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Bangladesh',
        phone: user.phone || '',
      },
    };

    // Save to 'users' collection
    await setDoc(doc(db, 'users', user.id), userPayload, { merge: true });

    // If customer, also save to 'customers' collection table
    if (user.role === 'customer') {
      await setDoc(doc(db, 'customers', user.id), userPayload, { merge: true });
    }

    return true;
  } catch (err) {
    console.warn('Firestore save customer error:', err);
    return false;
  }
};

export const saveFirestoreUserProfile = async (uid: string, data: Record<string, any>) => {
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore save user profile error:', err);
    return false;
  }
};

// Fetch all users / customers from Firestore
export const fetchFirestoreUsers = async (): Promise<User[]> => {
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    const users: User[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.email) {
        users.push({
          id: data.id || docSnap.id,
          email: data.email,
          role: data.role || 'customer',
          fullName: data.fullName || 'Customer',
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || '',
          createdAt: data.createdAt || new Date().toISOString(),
          approvalStatus: data.approvalStatus || 'approved',
          isBanned: data.isBanned || false,
          isVerified: data.isVerified ?? true,
          address: data.address || undefined,
        });
      }
    });
    return users;
  } catch (err) {
    console.warn('Firestore fetch users error:', err);
    return [];
  }
};

// ==========================================
// 3. Products CRUD & Firestore Persistence
// ==========================================
export const saveFirestoreProduct = async (product: Product): Promise<boolean> => {
  try {
    const prodRef = doc(db, 'products', product.id);
    await setDoc(prodRef, {
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description || '',
      price: Number(product.price),
      stockQuantity: Number(product.stockQuantity),
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      images: Array.isArray(product.images) ? product.images : [],
      isPublished: Boolean(product.isPublished),
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: product.updatedAt || new Date().toISOString(),
      updatedBy: product.updatedBy || 'admin',
      rating: product.rating || 5.0,
      reviewsCount: product.reviewsCount || 0,
      brand: product.brand || 'XEEROO',
      features: product.features || [],
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore save product error:', err);
    return false;
  }
};

export const deleteFirestoreProduct = async (productId: string): Promise<boolean> => {
  try {
    const prodRef = doc(db, 'products', productId);
    await deleteDoc(prodRef);
    return true;
  } catch (err) {
    console.warn('Firestore delete product error:', err);
    return false;
  }
};

export const fetchFirestoreProducts = async (): Promise<Product[]> => {
  try {
    const colRef = collection(db, 'products');
    const snapshot = await getDocs(colRef);
    const list: Product[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.title) {
        list.push({
          id: data.id || docSnap.id,
          title: data.title,
          slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: data.description || '',
          price: Number(data.price) || 0,
          stockQuantity: Number(data.stockQuantity) || 0,
          sku: data.sku || '',
          categoryId: data.categoryId || 'cat-audio',
          images: Array.isArray(data.images) && data.images.length > 0
            ? data.images
            : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
          isPublished: data.isPublished !== false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          updatedBy: data.updatedBy || 'admin',
          rating: Number(data.rating) || 5.0,
          reviewsCount: Number(data.reviewsCount) || 1,
          brand: data.brand || 'XEEROO',
          features: Array.isArray(data.features) ? data.features : [],
        });
      }
    });
    return list;
  } catch (err) {
    console.warn('Firestore fetch products error:', err);
    return [];
  }
};

// ==========================================
// 4. Categories CRUD & Firestore Persistence
// ==========================================
export const saveFirestoreCategory = async (category: Category): Promise<boolean> => {
  try {
    const catRef = doc(db, 'categories', category.id);
    await setDoc(catRef, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore save category error:', err);
    return false;
  }
};

export const fetchFirestoreCategories = async (): Promise<Category[]> => {
  try {
    const colRef = collection(db, 'categories');
    const snapshot = await getDocs(colRef);
    const list: Category[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.name) {
        list.push({
          id: data.id || docSnap.id,
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: data.description || '',
        });
      }
    });
    return list;
  } catch (err) {
    console.warn('Firestore fetch categories error:', err);
    return [];
  }
};

// ==========================================
// 5. Orders CRUD & Firestore Persistence
// ==========================================
export const saveFirestoreOrder = async (order: Order): Promise<boolean> => {
  try {
    const orderRef = doc(db, 'orders', order.id);
    await setDoc(orderRef, {
      id: order.id,
      userId: order.userId,
      userEmail: order.userEmail,
      status: order.status,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      items: order.items,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Firestore save order error:', err);
    return false;
  }
};

export const fetchFirestoreOrders = async (): Promise<Order[]> => {
  try {
    const colRef = collection(db, 'orders');
    const snapshot = await getDocs(colRef);
    const list: Order[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.userId && data.items) {
        list.push({
          id: data.id || docSnap.id,
          userId: data.userId,
          userEmail: data.userEmail || '',
          status: data.status || 'pending',
          totalAmount: Number(data.totalAmount) || 0,
          shippingAddress: data.shippingAddress || {
            fullName: 'Customer',
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Bangladesh',
            phone: '',
          },
          items: data.items || [],
          paymentMethod: data.paymentMethod || 'cod',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      }
    });
    return list;
  } catch (err) {
    console.warn('Firestore fetch orders error:', err);
    return [];
  }
};

// ==========================================
// 6. Master Sync & Seed Utility
// Seeds / syncs all products, categories, users/customers, and orders to Firestore
// ==========================================
export const syncAllDataToFirestore = async (
  products: Product[],
  categories: Category[],
  users: User[],
  orders: Order[],
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; counts: { products: number; categories: number; users: number; orders: number }; message: string }> => {
  try {
    onProgress?.('Initializing batch write to Firestore...');
    const batch = writeBatch(db);

    // 1. Sync Categories
    onProgress?.(`Syncing ${categories.length} categories to 'categories' collection...`);
    for (const cat of categories) {
      const ref = doc(db, 'categories', cat.id);
      batch.set(ref, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
      }, { merge: true });
    }

    // 2. Sync Products
    onProgress?.(`Syncing ${products.length} products to 'products' collection...`);
    for (const prod of products) {
      const ref = doc(db, 'products', prod.id);
      batch.set(ref, {
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        description: prod.description || '',
        price: Number(prod.price),
        stockQuantity: Number(prod.stockQuantity),
        sku: prod.sku || '',
        categoryId: prod.categoryId || '',
        images: Array.isArray(prod.images) ? prod.images : [],
        isPublished: Boolean(prod.isPublished),
        createdAt: prod.createdAt || new Date().toISOString(),
        updatedAt: prod.updatedAt || new Date().toISOString(),
        updatedBy: prod.updatedBy || 'admin',
        rating: prod.rating || 5.0,
        reviewsCount: prod.reviewsCount || 0,
        brand: prod.brand || 'XEEROO',
        features: prod.features || [],
      }, { merge: true });
    }

    // 3. Sync Users & Customers
    onProgress?.(`Syncing ${users.length} users and customer accounts to 'users' and 'customers' collections...`);
    for (const u of users) {
      const refUsers = doc(db, 'users', u.id);
      const userPayload = {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        phone: u.phone || '',
        approvalStatus: u.approvalStatus || 'approved',
        isVerified: u.isVerified ?? true,
        isBanned: u.isBanned ?? false,
        avatarUrl: u.avatarUrl || '',
        createdAt: u.createdAt || new Date().toISOString(),
        address: u.address || {
          fullName: u.fullName,
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Bangladesh',
          phone: u.phone || '',
        },
      };
      batch.set(refUsers, userPayload, { merge: true });

      if (u.role === 'customer') {
        const refCust = doc(db, 'customers', u.id);
        batch.set(refCust, userPayload, { merge: true });
      }
    }

    // 4. Sync Orders
    onProgress?.(`Syncing ${orders.length} orders to 'orders' collection...`);
    for (const ord of orders) {
      const ref = doc(db, 'orders', ord.id);
      batch.set(ref, {
        id: ord.id,
        userId: ord.userId,
        userEmail: ord.userEmail,
        status: ord.status,
        totalAmount: ord.totalAmount,
        shippingAddress: ord.shippingAddress,
        items: ord.items,
        paymentMethod: ord.paymentMethod,
        createdAt: ord.createdAt,
        updatedAt: ord.updatedAt,
      }, { merge: true });
    }

    // Commit batch
    onProgress?.('Committing all data to Cloud Firestore...');
    await batch.commit();

    return {
      success: true,
      counts: {
        products: products.length,
        categories: categories.length,
        users: users.length,
        orders: orders.length,
      },
      message: `Successfully synchronized all data to Firestore! (${products.length} products, ${users.length} users, ${categories.length} categories, ${orders.length} orders)`,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('Firestore batch sync error:', err);
    return {
      success: false,
      counts: { products: 0, categories: 0, users: 0, orders: 0 },
      message: error.message || 'Failed to synchronize with Firestore.',
    };
  }
};
