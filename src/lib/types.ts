export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
}
