import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
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
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { Product, User, Category, Order, BannerSlide, AppNotification, UserRole } from "../types";
import firebaseAppletConfig from "../../firebase-applet-config.json";

// Web app's Firebase configuration loaded from provisioned firebase-applet-config.json
const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
  storageBucket: firebaseAppletConfig.storageBucket,
  messagingSenderId: firebaseAppletConfig.messagingSenderId,
  appId: firebaseAppletConfig.appId,
  measurementId: firebaseAppletConfig.measurementId || "G-0VY2GNZYR9",
};

// Initialize Firebase App, Auth, Firestore with provisioned Database ID
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseAppletConfig.firestoreDatabaseId);
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
    let friendlyMessage = 'Authentication failed. Please check your credentials.';
    if (
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/invalid-login-credentials'
    ) {
      friendlyMessage = 'Incorrect password entered. Please check your credentials and try again.';
    } else if (error.code === 'auth/user-not-found') {
      friendlyMessage = 'No registered account found with this email.';
    } else if (error.code === 'auth/user-disabled') {
      friendlyMessage = 'This account has been disabled. Please contact customer support.';
    } else if (error.code === 'auth/too-many-requests') {
      friendlyMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.';
    } else if (error.code === 'auth/invalid-email') {
      friendlyMessage = 'Invalid email address format.';
    }
    return {
      success: false,
      code: error.code || 'auth/unknown',
      error: friendlyMessage,
    };
  }
};

export const registerFirebaseUser = async (email: string, pass: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return { success: true, user: userCredential.user };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    return { success: false, code: error.code || 'auth/unknown', error: error.message || 'Registration failed' };
  }
};

export const signInWithGooglePopup = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    console.warn("Google Sign-In Popup notice:", error);
    return {
      success: false,
      code: error.code || 'unknown',
      error: error.message || 'Google authentication was not completed.',
    };
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
      gender: user.gender || 'male',
      phone: user.phone || '',
      password: user.password || '',
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

// Sync user role across any doc matching user ID or email
export const updateFirestoreUserRoleByEmailAndId = async (
  userId: string,
  email: string,
  newRole: string,
  approvalStatus: string = 'approved'
): Promise<boolean> => {
  try {
    // 1. Direct update to doc by userId
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { role: newRole, approvalStatus }, { merge: true });

    // 2. Query any documents matching the email in users collection
    if (email && email.includes('@')) {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await setDoc(doc(db, 'users', d.id), { role: newRole, approvalStatus }, { merge: true });
      });
    }
    return true;
  } catch (err) {
    console.warn('Firestore update role error:', err);
    return false;
  }
};

export const normalizeUserRole = (rawRole: any, isAdminField?: boolean): UserRole => {
  if (isAdminField === true) return 'admin';
  const r = (rawRole || '').toString().toLowerCase().trim();
  if (r === 'admin' || r === 'administrator' || r === 'owner') return 'admin';
  if (r === 'moderator' || r === 'staff' || r === 'manager') return 'moderator';
  return 'customer';
};

// Fetch all users / customers from Firestore
export const fetchFirestoreUsers = async (): Promise<User[]> => {
  try {
    const colRef = collection(db, 'users');
    const snapshot = await getDocs(colRef);
    const users: User[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && (data.email || data.phone)) {
        // Discard legacy mock admin/staff if present
        if (
          data.email === 'admin@xeeroo.com' ||
          data.email === 'staff@xeeroo.com' ||
          docSnap.id === 'usr-admin-master' ||
          docSnap.id === 'usr-mod-staff'
        ) {
          return;
        }

        users.push({
          id: data.id || docSnap.id,
          email: data.email || '',
          role: normalizeUserRole(data.role, data.isAdmin),
          fullName: data.fullName || 'User',
          gender: (data.gender as any) || 'male',
          phone: data.phone || '',
          password: data.password || '',
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

// Fetch a single user by email, phone, or id directly from Firestore
export const fetchFirestoreUserByIdentifier = async (identifier: string): Promise<User | null> => {
  try {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/[^0-9]/g, '');

    // 1. Direct get by Document ID in 'users'
    try {
      const directDoc = await getDoc(doc(db, 'users', identifier.trim()));
      if (directDoc.exists()) {
        const data = directDoc.data();
        if (data && data.email !== 'admin@xeeroo.com' && data.email !== 'staff@xeeroo.com') {
          return {
            id: directDoc.id,
            email: data.email || '',
            role: normalizeUserRole(data.role, data.isAdmin),
            fullName: data.fullName || 'User',
            gender: (data.gender as any) || 'male',
            phone: data.phone || '',
            password: data.password || '',
            avatarUrl: data.avatarUrl || '',
            createdAt: data.createdAt || new Date().toISOString(),
            approvalStatus: data.approvalStatus || 'approved',
            isBanned: Boolean(data.isBanned),
            isVerified: data.isVerified ?? true,
            address: data.address || undefined,
          };
        }
      }
    } catch {
      // ignore
    }

    // 2. Query 'users' by email
    if (clean.includes('@')) {
      const qEmail = query(collection(db, 'users'), where('email', '==', clean));
      const snap = await getDocs(qEmail);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        if (data.email !== 'admin@xeeroo.com' && data.email !== 'staff@xeeroo.com') {
          return {
            id: d.id,
            email: data.email || clean,
            role: normalizeUserRole(data.role, data.isAdmin),
            fullName: data.fullName || 'User',
            gender: (data.gender as any) || 'male',
            phone: data.phone || '',
            password: data.password || '',
            avatarUrl: data.avatarUrl || '',
            createdAt: data.createdAt || new Date().toISOString(),
            approvalStatus: data.approvalStatus || 'approved',
            isBanned: Boolean(data.isBanned),
            isVerified: data.isVerified ?? true,
            address: data.address || undefined,
          };
        }
      }
    }

    // 3. Query 'users' by phone digits
    if (cleanDigits.length >= 8) {
      const snapAll = await getDocs(collection(db, 'users'));
      for (const d of snapAll.docs) {
        const data = d.data();
        const pDigits = (data.phone || '').replace(/[^0-9]/g, '');
        if (pDigits && (pDigits === cleanDigits || pDigits.endsWith(cleanDigits) || cleanDigits.endsWith(pDigits))) {
          if (data.email !== 'admin@xeeroo.com' && data.email !== 'staff@xeeroo.com') {
            return {
              id: d.id,
              email: data.email || '',
              role: normalizeUserRole(data.role, data.isAdmin),
              fullName: data.fullName || 'User',
              gender: (data.gender as any) || 'male',
              phone: data.phone || '',
              password: data.password || '',
              avatarUrl: data.avatarUrl || '',
              createdAt: data.createdAt || new Date().toISOString(),
              approvalStatus: data.approvalStatus || 'approved',
              isBanned: Boolean(data.isBanned),
              isVerified: data.isVerified ?? true,
              address: data.address || undefined,
            };
          }
        }
      }
    }

    // 4. Fallback: check 'customers' collection
    if (clean.includes('@')) {
      const qCust = query(collection(db, 'customers'), where('email', '==', clean));
      const snapCust = await getDocs(qCust);
      if (!snapCust.empty) {
        const d = snapCust.docs[0];
        const data = d.data();
        return {
          id: d.id,
          email: data.email || clean,
          role: normalizeUserRole(data.role, data.isAdmin),
          fullName: data.fullName || 'Customer',
          gender: (data.gender as any) || 'male',
          phone: data.phone || '',
          password: data.password || '',
          avatarUrl: data.avatarUrl || '',
          createdAt: data.createdAt || new Date().toISOString(),
          approvalStatus: data.approvalStatus || 'approved',
          isBanned: Boolean(data.isBanned),
          isVerified: data.isVerified ?? true,
          address: data.address || undefined,
        };
      }
    }

    return null;
  } catch (err) {
    console.warn('fetchFirestoreUserByIdentifier error:', err);
    return null;
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
      soldCount: Number(product.soldCount) || 0,
      sku: product.sku || '',
      categoryId: product.categoryId || '',
      images: Array.isArray(product.images) ? product.images : [],
      isPublished: Boolean(product.isPublished),
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: product.updatedAt || new Date().toISOString(),
      updatedBy: product.updatedBy || 'admin',
      rating: Number(product.rating) || 0,
      reviewsCount: Number(product.reviewsCount) || 0,
      reviews: Array.isArray(product.reviews) ? product.reviews : [],
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

/**
 * Real-time real-world subscription to Products in Firestore.
 * Automatically synchronizes across all browsers and users!
 */
export const subscribeToFirestoreProducts = (
  onProductsUpdate: (products: Product[]) => void,
  onError?: (err: Error) => void
) => {
  const colRef = collection(db, 'products');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.title) {
          const reviewsList = Array.isArray(data.reviews) ? data.reviews : [];
          const calculatedRating = reviewsList.length > 0
            ? Number((reviewsList.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1))
            : 0;

          list.push({
            id: data.id || docSnap.id,
            title: data.title,
            slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: data.description || '',
            price: Number(data.price) || 0,
            stockQuantity: Number(data.stockQuantity) || 0,
            soldCount: Number(data.soldCount) || 0,
            sku: data.sku || '',
            categoryId: data.categoryId || 'cat-audio',
            images: Array.isArray(data.images) ? data.images : [],
            isPublished: data.isPublished !== false,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
            updatedBy: data.updatedBy || 'admin',
            rating: calculatedRating,
            reviewsCount: reviewsList.length || Number(data.reviewsCount) || 0,
            reviews: reviewsList,
            brand: data.brand || 'XEEROO',
            features: Array.isArray(data.features) ? data.features : [],
          });
        }
      });
      onProductsUpdate(list);
    },
    (err) => {
      console.warn('Firestore onSnapshot products error:', err);
      onError?.(err);
    }
  );
};

export const fetchFirestoreProducts = async (): Promise<Product[]> => {
  try {
    const colRef = collection(db, 'products');
    const snapshot = await getDocs(colRef);
    const list: Product[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.title) {
        const reviewsList = Array.isArray(data.reviews) ? data.reviews : [];
        const calculatedRating = reviewsList.length > 0
          ? Number((reviewsList.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1))
          : 0;

        list.push({
          id: data.id || docSnap.id,
          title: data.title,
          slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: data.description || '',
          price: Number(data.price) || 0,
          stockQuantity: Number(data.stockQuantity) || 0,
          soldCount: Number(data.soldCount) || 0,
          sku: data.sku || '',
          categoryId: data.categoryId || 'cat-audio',
          images: Array.isArray(data.images) ? data.images : [],
          isPublished: data.isPublished !== false,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          updatedBy: data.updatedBy || 'admin',
          rating: calculatedRating,
          reviewsCount: reviewsList.length || Number(data.reviewsCount) || 0,
          reviews: reviewsList,
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
      ...(order.paymentDetails ? { paymentDetails: order.paymentDetails } : {}),
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
          paymentDetails: data.paymentDetails || undefined,
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

export const subscribeToFirestoreOrders = (
  onOrdersUpdate: (orders: Order[]) => void,
  onError?: (err: Error) => void
) => {
  const colRef = collection(db, 'orders');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && (data.id || docSnap.id)) {
          list.push({
            id: data.id || docSnap.id,
            userId: data.userId || 'guest',
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
            items: Array.isArray(data.items) ? data.items : [],
            paymentMethod: data.paymentMethod || 'cod',
            paymentDetails: data.paymentDetails || undefined,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          });
        }
      });
      // Sort newest order first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onOrdersUpdate(list);
    },
    (err) => {
      console.warn('Firestore onSnapshot orders error:', err);
      onError?.(err);
    }
  );
};

export const subscribeToFirestoreUsers = (
  onUsersUpdate: (users: User[]) => void,
  onError?: (err: Error) => void
) => {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: User[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && (data.email || data.phone)) {
          // Discard legacy mock admin/staff if present
          if (
            data.email === 'admin@xeeroo.com' ||
            data.email === 'staff@xeeroo.com' ||
            docSnap.id === 'usr-admin-master' ||
            docSnap.id === 'usr-mod-staff'
          ) {
            return;
          }

          list.push({
            id: data.id || docSnap.id,
            email: data.email || '',
            role: normalizeUserRole(data.role, data.isAdmin),
            fullName: data.fullName || 'User',
            gender: (data.gender as any) || 'male',
            phone: data.phone || '',
            password: data.password || '',
            avatarUrl: data.avatarUrl || '',
            createdAt: data.createdAt || new Date().toISOString(),
            approvalStatus: data.approvalStatus || 'approved',
            isBanned: data.isBanned || false,
            isVerified: data.isVerified ?? true,
            address: data.address || undefined,
          });
        }
      });
      onUsersUpdate(list);
    },
    (err) => {
      console.warn('Firestore onSnapshot users error:', err);
      onError?.(err);
    }
  );
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

// ==========================================
// 8. Notifications Collection (Real-time Sync)
// ==========================================
export const saveFirestoreNotification = async (notification: AppNotification): Promise<boolean> => {
  try {
    const docRef = doc(db, 'notifications', notification.id);
    const cleanData: Record<string, any> = {
      id: notification.id,
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'system',
      isRead: Boolean(notification.isRead),
      createdAt: notification.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (notification.userId) cleanData.userId = notification.userId;
    if (notification.userEmail) cleanData.userEmail = notification.userEmail;
    if (notification.targetRole) cleanData.targetRole = notification.targetRole;
    if (notification.orderId) cleanData.orderId = notification.orderId;
    if (notification.productId) cleanData.productId = notification.productId;
    if (notification.productTitle) cleanData.productTitle = notification.productTitle;
    if (notification.link) cleanData.link = notification.link;

    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to save notification to Firestore:', err);
    return false;
  }
};

export const subscribeToFirestoreNotifications = (
  onNotificationsUpdate: (notifications: AppNotification[]) => void,
  onError?: (err: unknown) => void
) => {
  const colRef = collection(db, 'notifications');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.title) {
          list.push({
            id: data.id || docSnap.id,
            userId: data.userId || '',
            userEmail: data.userEmail || '',
            targetRole: data.targetRole || 'all',
            type: data.type || 'system',
            title: data.title || '',
            message: data.message || '',
            orderId: data.orderId || '',
            productId: data.productId || '',
            productTitle: data.productTitle || '',
            isRead: Boolean(data.isRead),
            createdAt: data.createdAt || new Date().toISOString(),
            link: data.link || '',
          });
        }
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onNotificationsUpdate(list);
    },
    (err) => {
      console.warn('Firestore onSnapshot notifications error:', err);
      onError?.(err);
    }
  );
};

export const fetchFirestoreNotifications = async (): Promise<AppNotification[]> => {
  try {
    const colRef = collection(db, 'notifications');
    const snapshot = await getDocs(colRef);
    const list: AppNotification[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.title) {
        list.push({
          id: data.id || docSnap.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          targetRole: data.targetRole || 'all',
          type: data.type || 'system',
          title: data.title || '',
          message: data.message || '',
          orderId: data.orderId || '',
          productId: data.productId || '',
          productTitle: data.productTitle || '',
          isRead: Boolean(data.isRead),
          createdAt: data.createdAt || new Date().toISOString(),
          link: data.link || '',
        });
      }
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (err) {
    console.warn('Firestore fetch notifications error:', err);
    return [];
  }
};

export const updateFirestoreNotification = async (
  id: string,
  updates: Partial<AppNotification>
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'notifications', id);
    await setDoc(docRef, updates, { merge: true });
    return true;
  } catch (err) {
    console.warn('Failed to update notification in Firestore:', err);
    return false;
  }
};

export const deleteFirestoreNotification = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'notifications', id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn('Failed to delete notification in Firestore:', err);
    return false;
  }
};
