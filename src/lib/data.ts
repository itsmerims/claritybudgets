import type { Category, Expense, Budget } from './types';

export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Groceries' },
  { id: 'cat-2', name: 'Dining Out' },
  { id: 'cat-3', name: 'Transport' },
  { id: 'cat-4', name: 'Entertainment' },
  { id: 'cat-5', name: 'Utilities' },
  { id: 'cat-6', name: 'Shopping' },
  { id: 'cat-7', name: 'Health' },
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    description: 'Weekly grocery run',
    amount: 75.5,
    categoryId: 'cat-1',
    date: '2024-05-20',
  },
  {
    id: 'exp-2',
    description: 'Dinner with friends',
    amount: 45.0,
    categoryId: 'cat-2',
    date: '2024-05-18',
  },
  {
    id: 'exp-3',
    description: 'Monthly bus pass',
    amount: 55.0,
    categoryId: 'cat-3',
    date: '2024-05-15',
  },
  {
    id: 'exp-4',
    description: 'Movie tickets',
    amount: 25.0,
    categoryId: 'cat-4',
    date: '2024-05-12',
  },
  {
    id: 'exp-5',
    description: 'Electricity bill',
    amount: 65.25,
    categoryId: 'cat-5',
    date: '2024-05-10',
  },
];

export const initialBudgets: Budget[] = [
  {
    id: 'bud-1',
    categoryId: 'cat-1',
    amount: 400,
  },
  {
    id: 'bud-2',
    categoryId: 'cat-2',
    amount: 150,
  },
  {
    id: 'bud-3',
    categoryId: 'cat-4',
    amount: 100,
  },
];
