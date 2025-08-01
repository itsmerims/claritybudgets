export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  date: string;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
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

export interface Currency {
    code: string;
    symbol: string;
    name: string;
}

export interface Loan {
  id: string;
  name: string;
  lender: string;
  initialAmount: number;
  currentBalance: number;
  date: string;
}
