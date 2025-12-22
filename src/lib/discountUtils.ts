export interface Discount {
  id: number;
  name: string;
  type: "Product" | "Category";
  target: string;
  percentage: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export const loadDiscounts = (): Discount[] => {
  try {
    const stored = localStorage.getItem('discounts');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load discounts:', e);
  }
  return [];
};

export const getActiveDiscount = (product: any, discounts: Discount[]): Discount | null => {
  if (!product || !product.name || !product.category) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return discounts.find(d => {
    const startDate = new Date(d.startDate);
    const endDate = new Date(d.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const isDateActive = today >= startDate && today <= endDate;
    if (!isDateActive) return false;

    if (d.type === "Product") {
      return d.target.toLowerCase() === product.name.toLowerCase();
    } else {
      return d.target.toLowerCase() === product.category.toLowerCase();
    }
  }) || null;
};

export const getDiscountedPrice = (price: number, discount: Discount | null): number => {
  if (!discount) return Number(price);
  return price * (1 - discount.percentage / 100);
};

export const getPriceToDisplay = (price: number, product: any, discounts: Discount[]): number => {
  const discount = getActiveDiscount(product, discounts);
  return getDiscountedPrice(price, discount);
};
