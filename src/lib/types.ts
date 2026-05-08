import { Timestamp } from 'firebase/firestore';

export type Locale = 'en' | 'ar' | 'ru';

export type LocalizedString = {
  [key in Locale]: string;
};

export type Category = 'breakfast' | 'salads-appetizers' | 'main-courses' | 'snacks' | 'desserts' | 'hot-drinks' | 'cold-drinks' | 'dinner' | 'lunch' | 'kids-meals';

export interface Dish {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  category: Category;
  price: number;
  calories: number;
  imageId: string;
  protein: number;
  sugar: number;
  portionSize: string; // e.g., "250g" or "300ml"
  dailyTip: LocalizedString;
};

export type CartItem = {
  dish: Dish;
  quantity: number;
};

export type OrderItem = {
  id: string;
  name: LocalizedString;
  quantity: number;
  price: number;
};

export type CustomerDetails = {
  fullName: string;
  address: string;
  phone: string;
};

export type Order = {
  id:string;
  userId: string;
  customerDetails: CustomerDetails;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'preparing' | 'done' | 'cancelled';
  createdAt: Timestamp;
};

export type UserRole = 'customer' | 'staff' | 'admin';

// Represents a user's profile information stored in /customers/{uid}
export type Customer = {
  id: string; // This will be the UID
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  jobTitle?: string;
  preferredLanguage?: Locale;
};

export type Testimonial = {
  id: string;
  author: string;
  text: LocalizedString;
  rating: number;
  userId: string;
  createdAt: Timestamp;
};
