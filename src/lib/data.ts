import type { Category, Expense, Budget, Currency, Income } from './types';

export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Groceries' },
  { id: 'cat-2', name: 'Dining Out' },
  { id: 'cat-3', name: 'Transport' },
  { id: 'cat-4', name: 'Entertainment' },
  { id: 'cat-5', name: 'Utilities' },
  { id: 'cat-6', name: 'Shopping' },
  { id: 'cat-7', name: 'Health' },
  { id: 'cat-8', name: 'Loan Repayment' },
];

export const initialExpenses: Expense[] = [];

export const initialIncomes: Income[] = [];

export const initialBudgets: Budget[] = [];

export const currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];
