
"use client";

import { autoCategorizeExpense } from "@/ai/flows/auto-categorize-expense";
import { generateSavingTips } from "@/ai/flows/generate-saving-tips";
import { initialCategories, currencies } from "@/lib/data";
import type { Budget, Category, Expense, Currency, Income, Loan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Landmark,
  Lightbulb,
  Loader2,
  PieChart as PieChartIcon,
  Plus,
  Sprout,
  TrendingUp,
  Wallet,
  Sparkles,
  ChevronDown,
  DollarSign,
  ArrowDown,
  ArrowUp,
  RefreshCcw,
  LogOut,
  HandCoins,
  Minus,
  MoreVertical,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from "recharts";
import { z } from "zod";
import Link from 'next/link';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDocs, writeBatch, addDoc, updateDoc, deleteDoc, query, orderBy, getDoc, setDoc } from 'firebase/firestore';
import { ThemeToggle } from "./theme-toggle";


const expenseSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  categoryId: z.string().min(1, "Category is required."),
  date: z.string().min(1, "Date is required."),
});

const incomeSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.string().min(1, "Date is required."),
});

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
});

const loanSchema = z.object({
    name: z.string().min(1, "A name for the loan is required."),
    lender: z.string().min(1, "Lender is required."),
    amount: z.coerce.number().positive("Initial amount must be positive."),
    date: z.string().min(1, "Date is required."),
});

const updateLoanSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be a positive number."),
    type: z.enum(["increase", "decrease"]),
});


export default function ClarityDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [currency, setCurrency] = useState<Currency>(currencies[0]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const fetchData = useCallback(async (userId: string) => {
    setIsLoadingData(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      
      const settingsRef = doc(userDocRef, 'settings', 'userSettings');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists() && settingsSnap.data().currency) {
        const foundCurrency = currencies.find(c => c.code === settingsSnap.data().currency);
        if (foundCurrency) {
          setCurrency(foundCurrency);
        }
      }

      const categoriesRef = collection(db, 'users', userId, 'categories');
      const categoriesSnap = await getDocs(categoriesRef);

      let fetchedCategories: Category[] = [];
      if (categoriesSnap.empty) {
        // First time user, create initial categories
        const batch = writeBatch(db);
        initialCategories.forEach(cat => {
            const docRef = doc(categoriesRef);
            batch.set(docRef, {name: cat.name});
            fetchedCategories.push({ ...cat, id: docRef.id });
        });
        await batch.commit();
        setCategories(fetchedCategories);
      } else {
        fetchedCategories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(fetchedCategories);
      }

      const expensesQuery = query(collection(db, 'users', userId, 'expenses'), orderBy('date', 'desc'));
      const expensesSnap = await getDocs(expensesQuery);
      setExpenses(expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
      
      const incomesQuery = query(collection(db, 'users', userId, 'incomes'), orderBy('date', 'desc'));
      const incomesSnap = await getDocs(incomesQuery);
      setIncomes(incomesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income)));

      const budgetsSnap = await getDocs(collection(db, 'users', userId, 'budgets'));
      setBudgets(budgetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget)));
      
      const loansQuery = query(collection(db, 'users', userId, 'loans'), orderBy('date', 'desc'));
      const loansSnap = await getDocs(loansQuery);
      setLoans(loansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan)));

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch your financial data. You might be offline.",
      });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchData(user.uid);
    }
  }, [user, fetchData]);


  useEffect(() => {
    async function saveCurrency() {
        if (!user) return;
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const settingsRef = doc(userDocRef, 'settings', 'userSettings');
            await setDoc(settingsRef, { currency: currency.code }, { merge: true });
        } catch (error) {
            console.error("Error saving currency:", error);
        }
    }
    if(!isLoadingData) { // only save after initial data has loaded
        saveCurrency();
    }
  }, [currency, user, isLoadingData]);

  const [isExpenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [isLoanDialogOpen, setLoanDialogOpen] = useState(false);
  const [isUpdateLoanDialogOpen, setUpdateLoanDialogOpen] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);
  const [savingTips, setSavingTips] = useState("");

  const expenseForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      categoryId: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const incomeForm = useForm<z.infer<typeof incomeSchema>>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      description: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const budgetForm = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: "",
      amount: 0,
    },
  });

   const loanForm = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      name: "",
      lender: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
    },
  });

  const updateLoanForm = useForm<z.infer<typeof updateLoanSchema>>({
    resolver: zodResolver(updateLoanSchema),
    defaultValues: {
      amount: 0,
      type: "decrease",
    },
  });

  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {} as Record<string, Category>);
  }, [categories]);

  const { totalIncome, totalSpent, remainingBalance } = useMemo(() => {
    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remainingBalance = totalIncome - totalSpent;
    return { totalIncome, totalSpent, remainingBalance };
  }, [incomes, expenses]);

  const totalLoanBalance = useMemo(() => {
    return loans.reduce((sum, loan) => sum + (loan.currentBalance || loan.initialAmount), 0);
  }, [loans]);

  const spendingByCategory = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const categoryName = categoryMap[expense.categoryId]?.name || "Uncategorized";
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses, categoryMap]);

  const chartData = useMemo(() => {
    return Object.entries(spendingByCategory).map(([name, value]) => ({
      name,
      value,
    }));
  }, [spendingByCategory]);
  
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    Object.keys(spendingByCategory).forEach((name, index) => {
      config[name] = {
        label: name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [spendingByCategory]);


  const budgetProgress = useMemo(() => {
    return budgets.map((budget) => {
      const spent = expenses
        .filter((exp) => exp.categoryId === budget.categoryId)
        .reduce((sum, exp) => sum + exp.amount, 0);
      const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return {
        ...budget,
        categoryName: categoryMap[budget.categoryId]?.name || "Unknown",
        spent,
        progress,
      };
    });
  }, [budgets, expenses, categoryMap]);

  async function handleAddExpense(values: z.infer<typeof expenseSchema>) {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'expenses'), values);
      const newExpense: Expense = {
        id: docRef.id,
        ...values,
      };
      setExpenses([newExpense, ...expenses]);
      expenseForm.reset({
        description: "",
        amount: 0,
        categoryId: "",
        date: new Date().toISOString().split("T")[0],
      });
      setExpenseDialogOpen(false);
      toast({
        title: "Expense Added",
        description: `${values.description} for ${currency.symbol}${values.amount} has been logged.`,
      });
    } catch (error) {
       console.error("Error adding expense:", error);
       toast({ variant: "destructive", title: "Error", description: "Could not add expense." });
    }
  }
  
  async function handleAddIncome(values: z.infer<typeof incomeSchema>) {
     if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'incomes'), values);
      const newIncome: Income = {
        id: docRef.id,
        ...values,
      };
      setIncomes([newIncome, ...incomes]);
      incomeForm.reset({
        description: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
      });
      setIncomeDialogOpen(false);
      toast({
        title: "Income Added",
        description: `${values.description} for ${currency.symbol}${values.amount} has been logged.`,
      });
    } catch (error) {
       console.error("Error adding income:", error);
       toast({ variant: "destructive", title: "Error", description: "Could not add income." });
    }
  }

  async function handleAddBudget(values: z.infer<typeof budgetSchema>) {
    if (!user) return;
    try {
      const existingBudget = budgets.find(
        (b) => b.categoryId === values.categoryId
      );

      if (existingBudget) {
        const budgetRef = doc(db, 'users', user.uid, 'budgets', existingBudget.id);
        await updateDoc(budgetRef, { amount: values.amount });
        setBudgets(budgets.map(b => b.id === existingBudget.id ? {...b, amount: values.amount} : b));
      } else {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'budgets'), values);
        const newBudget: Budget = {
          id: docRef.id,
          ...values,
        };
        setBudgets([...budgets, newBudget]);
      }
      budgetForm.reset({ categoryId: "", amount: 0 });
      setBudgetDialogOpen(false);
      toast({
        title: "Budget Set",
        description: `Budget for ${
          categoryMap[values.categoryId]?.name
        } set to ${currency.symbol}${values.amount}.`,
      });
    } catch (error) {
       console.error("Error setting budget:", error);
       toast({ variant: "destructive", title: "Error", description: "Could not set budget." });
    }
  }

  async function handleAddLoan(values: z.infer<typeof loanSchema>) {
    if (!user) return;
    try {
      const loanData = {
        name: values.name,
        lender: values.lender,
        initialAmount: values.amount,
        currentBalance: values.amount,
        date: values.date,
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'loans'), loanData);
      const newLoan: Loan = { id: docRef.id, ...loanData };
      setLoans([newLoan, ...loans]);
      loanForm.reset({
        name: "",
        lender: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
      });
      setLoanDialogOpen(false);
      toast({
        title: "Loan Added",
        description: `Loan "${values.name}" for ${currency.symbol}${values.amount} has been logged.`,
      });
    } catch (error) {
      console.error("Error adding loan:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not add loan." });
    }
  }

  async function handleUpdateLoan(values: z.infer<typeof updateLoanSchema>) {
    if (!user || !selectedLoan) return;

    const batch = writeBatch(db);

    let newBalance = selectedLoan.currentBalance;
    if (values.type === "decrease") {
        newBalance -= values.amount;
    } else {
        newBalance += values.amount;
    }

    if (newBalance < 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "Balance cannot be negative." });
        return;
    }
    
    const loanRef = doc(db, 'users', user.uid, 'loans', selectedLoan.id);
    batch.update(loanRef, { currentBalance: newBalance });
    
    let newExpense: Expense | null = null;
    if (values.type === 'decrease') {
        let loanPaymentCategory = categories.find(c => c.name === "Loan Repayment");

        if (!loanPaymentCategory) {
            try {
                const categoryData = { name: "Loan Repayment" };
                const categoriesRef = collection(db, 'users', user.uid, 'categories');
                const newCategoryDoc = await addDoc(categoriesRef, categoryData);
                const newCategory: Category = { id: newCategoryDoc.id, name: categoryData.name };
                setCategories(prev => [...prev, newCategory]);
                loanPaymentCategory = newCategory;
            } catch (error) {
                console.error("Error creating 'Loan Repayment' category:", error);
                toast({ variant: "destructive", title: "Error", description: "Could not create a required category. Please try again." });
                return;
            }
        }

        const expenseData: Omit<Expense, 'id'> = {
            description: `Payment for "${selectedLoan.name}"`,
            amount: values.amount,
            categoryId: loanPaymentCategory.id,
            date: new Date().toISOString().split('T')[0],
        };
        
        const expenseRef = doc(collection(db, 'users', user.uid, 'expenses'));
        batch.set(expenseRef, expenseData);
        newExpense = { id: expenseRef.id, ...expenseData };
    }


    try {
        await batch.commit();
        
        setLoans(loans.map(l => l.id === selectedLoan.id ? { ...l, currentBalance: newBalance } : l));
        if (newExpense) {
            setExpenses(prevExpenses => [newExpense!, ...prevExpenses]);
        }
        
        updateLoanForm.reset({ amount: 0, type: "decrease" });
        setUpdateLoanDialogOpen(false);
        setSelectedLoan(null);
        
        toast({
            title: "Loan Updated",
            description: `Loan "${selectedLoan.name}" balance is now ${currency.symbol}${newBalance.toFixed(2)}.`,
        });
        if (newExpense) {
            toast({
                title: "Expense Logged",
                description: `A payment of ${currency.symbol}${values.amount.toFixed(2)} was logged.`,
            });
        }
    } catch (error) {
        console.error("Error updating loan:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update loan." });
    }
  }


  async function handleAutoCategorize() {
    const description = expenseForm.getValues("description");
    if (!description) {
      expenseForm.setError("description", {
        type: "manual",
        message: "Please enter a description first.",
      });
      return;
    }

    setIsCategorizing(true);
    try {
      const result = await autoCategorizeExpense({ description, categories });
      const category = categories.find(
        (c) => c.name.toLowerCase() === result.category.toLowerCase()
      );
      if (category) {
        expenseForm.setValue("categoryId", category.id);
        toast({
          title: "Auto-Categorized!",
          description: `Expense categorized as "${result.category}" with ${Math.round(result.confidence * 100)}% confidence.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Category not found",
          description: `AI suggested "${result.category}", but it's not in your list. Please add it or choose another.`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not auto-categorize expense.",
      });
    } finally {
      setIsCategorizing(false);
    }
  }

  async function handleGenerateSavingTips() {
    setIsGeneratingTips(true);
    setSavingTips("");
    try {
      const spendingSummary = Object.entries(spendingByCategory)
        .map(([category, amount]) => `${category}: ${currency.symbol}${amount.toFixed(2)}`)
        .join('\n');
        
      const spendingHabits = `Currency: ${currency.name} (${currency.code})\nTotal Income: ${currency.symbol}${totalIncome.toFixed(2)}\nTotal Spending: ${currency.symbol}${totalSpent.toFixed(2)}\n\nSpending Breakdown:\n${spendingSummary}`;

      const result = await generateSavingTips({ spendingHabits });
      setSavingTips(result.savingTips);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "AI Error",
        description: "Could not generate saving tips.",
      });
    } finally {
      setIsGeneratingTips(false);
    }
  }

  function openUpdateLoanDialog(loan: Loan) {
    setSelectedLoan(loan);
    updateLoanForm.reset({ amount: 0, type: 'decrease' });
    setUpdateLoanDialogOpen(true);
  }

  async function handleLogout() {
    await auth.signOut();
  }
  
  if (isLoadingData) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your financial data...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold md:text-2xl">
          <Link href="/" className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-primary" />
            <span className="font-headline hidden sm:inline">ClarityBudgets</span>
          </Link>
        </h1>
        <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-20">
                <span>{currency.code}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currencies.map((c) => (
                <DropdownMenuItem key={c.code} onClick={() => setCurrency(c)}>
                  {c.code} ({c.symbol})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Dialog open={isBudgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Landmark className="mr-2 h-4 w-4" />
                  Set Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set a Budget</DialogTitle>
                  <DialogDescription>
                    Define a budget for a category. This will update an existing budget if one is already set.
                  </DialogDescription>
                </DialogHeader>
                <Form {...budgetForm}>
                  <form
                    onSubmit={budgetForm.handleSubmit(handleAddBudget)}
                    className="space-y-4"
                  >
                    <FormField
                      control={budgetForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={budgetForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Amount</FormLabel>
                          <FormControl>
                             <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency.symbol}</span>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} onFocus={e => e.target.select()} className="pl-8"/>
                             </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Set Budget</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isIncomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-green-600 border-green-600/50 hover:bg-green-600/10 hover:text-green-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Income
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log a New Income</DialogTitle>
                  <DialogDescription>
                    Enter the details of your income below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...incomeForm}>
                  <form
                    onSubmit={incomeForm.handleSubmit(handleAddIncome)}
                    className="space-y-4"
                  >
                    <FormField
                      control={incomeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Monthly Salary" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={incomeForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                             <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency.symbol}</span>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} onFocus={e => e.target.select()} className="pl-8"/>
                             </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={incomeForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Add Income</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isExpenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Log Expense
                </Button>
              </DialogTrigger>
               <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log a New Expense</DialogTitle>
                  <DialogDescription>
                    Enter the details of your expense below.
                  </DialogDescription>
                </DialogHeader>
                <Form {...expenseForm}>
                  <form
                    onSubmit={expenseForm.handleSubmit(handleAddExpense)}
                    className="space-y-4"
                  >
                    <FormField
                      control={expenseForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Coffee with a friend" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                             <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency.symbol}</span>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} onFocus={e => e.target.select()} className="pl-8"/>
                             </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <div className="flex gap-2">
                             <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="outline" type="button" onClick={handleAutoCategorize} disabled={isCategorizing}>
                              {isCategorizing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                            </Button>
                          </div>
                          <FormDescription>
                            Or use AI to categorize based on description.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">Add Expense</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog open={isLoanDialogOpen} onOpenChange={setLoanDialogOpen}>
              <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                      <HandCoins className="mr-2 h-4 w-4" /> Log Loan
                  </Button>
              </DialogTrigger>
               <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Log a New Loan</DialogTitle>
                      <DialogDescription>
                          Enter the details of the loan you've taken.
                      </DialogDescription>
                  </DialogHeader>
                  <Form {...loanForm}>
                      <form onSubmit={loanForm.handleSubmit(handleAddLoan)} className="space-y-4">
                          <FormField
                              control={loanForm.control}
                              name="name"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Loan Name</FormLabel>
                                      <FormControl>
                                          <Input placeholder="e.g., Car Loan" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={loanForm.control}
                              name="lender"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Lender</FormLabel>
                                      <FormControl>
                                          <Input placeholder="e.g., Bank of America, Mom" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={loanForm.control}
                              name="amount"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Initial Amount</FormLabel>
                                      <FormControl>
                                          <div className="relative">
                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency.symbol}</span>
                                              <Input type="number" step="0.01" placeholder="0.00" {...field} onFocus={e => e.target.select()} className="pl-8" />
                                          </div>
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={loanForm.control}
                              name="date"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Date</FormLabel>
                                      <FormControl>
                                          <Input type="date" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <DialogFooter>
                              <Button type="submit">Add Loan</Button>
                          </DialogFooter>
                      </form>
                  </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Mobile Dropdown */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setExpenseDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Log Expense</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIncomeDialogOpen(true)}>
                   <Plus className="mr-2 h-4 w-4" />
                   <span>Add Income</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBudgetDialogOpen(true)}>
                   <Landmark className="mr-2 h-4 w-4" />
                   <span>Set Budget</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => setLoanDialogOpen(true)}>
                    <HandCoins className="mr-2 h-4 w-4" />
                    <span>Log Loan</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button size="sm" variant="ghost" onClick={handleLogout} className="hidden sm:flex">
              <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>

        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground text-green-600">
              <DollarSign className="h-5 w-5" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold font-headline text-green-600">
              {currency.symbol}{totalIncome.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground text-red-600">
              <TrendingUp className="h-5 w-5" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold font-headline text-red-600">
              {currency.symbol}{totalSpent.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className={cn(remainingBalance < 0 ? 'bg-destructive/10 border-destructive/50' : '')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-5 w-5" />
              Remaining Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl md:text-3xl font-bold font-headline">
              {currency.symbol}{remainingBalance.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <HandCoins className="h-5 w-5" />
                    Total Loans
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl md:text-3xl font-bold font-headline">
                    {currency.symbol}{totalLoanBalance.toFixed(2)}
                </p>
            </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
              <Landmark className="h-5 w-5" />
              Category Budgets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetProgress.length > 0 ? (
              budgetProgress.map((budget) => (
                <div key={budget.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{budget.categoryName}</span>
                    <span className="text-muted-foreground">
                      {currency.symbol}{budget.spent.toFixed(2)} / {currency.symbol}{budget.amount.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={budget.progress} className="h-2" />
                </div>
              ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No budgets set. Click "Set Budget" to start.</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Spending by Category
            </CardTitle>
            <CardDescription>A visual breakdown of your expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length > 0 ? (
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel formatter={(value) => `${currency.symbol}${value.toLocaleString()}`} />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name]?.color} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  className="-translate-y-2"
                />
              </PieChart>
            </ChartContainer>
            ) : (
                <div className="flex h-[300px] items-center justify-center">
                    <p className="text-sm text-muted-foreground">Log an expense to see your spending breakdown.</p>
                </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI-Powered Saving Tips
            </CardTitle>
            <CardDescription>Get personalized advice based on your spending.</CardDescription>
          </CardHeader>
          <CardContent>
            {isGeneratingTips ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : savingTips ? (
              <div className="space-y-4">
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Here are your tips!</AlertTitle>
                  <AlertDescription className="whitespace-pre-line">
                    {savingTips}
                  </AlertDescription>
                </Alert>
                <Button onClick={handleGenerateSavingTips} disabled={isGeneratingTips} variant="outline" className="w-full">
                  <RefreshCcw className="mr-2 h-4 w-4"/>
                  Generate New Tips
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate tips from our AI financial assistant.
                </p>
                <Button onClick={handleGenerateSavingTips} disabled={expenses.length === 0 || isGeneratingTips}>
                  {isGeneratingTips ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                  Generate Tips
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="expenses">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="expenses">
                  <ArrowDown className="mr-2 h-4 w-4 text-red-500" /> Expenses
                </TabsTrigger>
                <TabsTrigger value="income">
                   <ArrowUp className="mr-2 h-4 w-4 text-green-500" /> Income
                </TabsTrigger>
                <TabsTrigger value="loans">
                    <HandCoins className="mr-2 h-4 w-4" /> Loans
                </TabsTrigger>
              </TabsList>
              <TabsContent value="expenses">
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.length > 0 ? (
                        expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>{categoryMap[expense.categoryId]?.name}</TableCell>
                            <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right font-medium text-red-600">-{currency.symbol}{expense.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                            No expenses yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                 <div className="sm:hidden space-y-4 pt-4">
                    {expenses.length > 0 ? (
                        expenses.map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                                <div>
                                    <p className="font-medium">{expense.description}</p>
                                    <p className="text-sm text-muted-foreground">{categoryMap[expense.categoryId]?.name} &middot; {new Date(expense.date).toLocaleDateString()}</p>
                                </div>
                                <p className="font-medium text-red-600">-{currency.symbol}{expense.amount.toFixed(2)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No expenses yet.</p>
                    )}
                </div>
              </TabsContent>
              <TabsContent value="income">
                 <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomes.length > 0 ? (
                        incomes.map((income) => (
                          <TableRow key={income.id}>
                            <TableCell className="font-medium">{income.description}</TableCell>
                            <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">+{currency.symbol}{income.amount.toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center h-24">
                            No income yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                 <div className="sm:hidden space-y-4 pt-4">
                    {incomes.length > 0 ? (
                        incomes.map((income) => (
                            <div key={income.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                                <div>
                                    <p className="font-medium">{income.description}</p>
                                    <p className="text-sm text-muted-foreground">{new Date(income.date).toLocaleDateString()}</p>
                                </div>
                                <p className="font-medium text-green-600">+{currency.symbol}{income.amount.toFixed(2)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No income yet.</p>
                    )}
                </div>
              </TabsContent>
              <TabsContent value="loans">
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan</TableHead>
                        <TableHead>Lender</TableHead>
                        <TableHead>Initial Amount</TableHead>
                        <TableHead>Current Balance</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.length > 0 ? (
                        loans.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">{loan.name}</TableCell>
                            <TableCell>{loan.lender}</TableCell>
                            <TableCell>{currency.symbol}{loan.initialAmount.toFixed(2)}</TableCell>
                            <TableCell className="font-medium">{currency.symbol}{loan.currentBalance.toFixed(2)}</TableCell>
                            <TableCell>{new Date(loan.date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => openUpdateLoanDialog(loan)}>Update</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24">
                            No loans yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="sm:hidden space-y-4 pt-4">
                    {loans.length > 0 ? (
                        loans.map((loan) => (
                           <Card key={loan.id} className="p-4">
                               <div className="flex justify-between items-start">
                                   <div>
                                       <p className="font-medium">{loan.name}</p>
                                       <p className="text-sm text-muted-foreground">{loan.lender}</p>
                                       <p className="text-xs text-muted-foreground pt-1">
                                           Taken on: {new Date(loan.date).toLocaleDateString()}
                                       </p>
                                   </div>
                                   <Button variant="outline" size="sm" onClick={() => openUpdateLoanDialog(loan)}>Update</Button>
                               </div>
                               <div className="flex justify-between items-end mt-4">
                                   <div>
                                       <p className="text-xs text-muted-foreground">Initial</p>
                                       <p className="text-sm">{currency.symbol}{loan.initialAmount.toFixed(2)}</p>
                                   </div>
                                   <div>
                                       <p className="text-xs text-muted-foreground text-right">Balance</p>
                                       <p className="font-medium text-right">{currency.symbol}{loan.currentBalance.toFixed(2)}</p>
                                   </div>
                               </div>
                           </Card>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground py-10">No loans yet.</p>
                    )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Dialog open={isUpdateLoanDialogOpen} onOpenChange={(isOpen) => { setUpdateLoanDialogOpen(isOpen); if (!isOpen) setSelectedLoan(null); }}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Update Loan: {selectedLoan?.name}</DialogTitle>
                  <DialogDescription>
                      Increase the balance (borrow more) or decrease it (make a payment).
                      Current Balance: {currency.symbol}{selectedLoan?.currentBalance.toFixed(2)}
                  </DialogDescription>
              </DialogHeader>
              <Form {...updateLoanForm}>
                  <form onSubmit={updateLoanForm.handleSubmit(handleUpdateLoan)} className="space-y-4">
                      <FormField
                          control={updateLoanForm.control}
                          name="type"
                          render={({ field }) => (
                              <FormItem className="space-y-3">
                                  <FormLabel>Transaction Type</FormLabel>
                                  <FormControl>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                              <SelectTrigger>
                                                  <SelectValue placeholder="Select a transaction type" />
                                              </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                              <SelectItem value="decrease">
                                                  <span className="flex items-center"><Minus className="mr-2 h-4 w-4 text-green-500" /> Make a Payment</span>
                                              </SelectItem>
                                              <SelectItem value="increase">
                                                  <span className="flex items-center"><Plus className="mr-2 h-4 w-4 text-red-500" /> Borrow More</span>
                                              </SelectItem>
                                          </SelectContent>
                                      </Select>
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                          control={updateLoanForm.control}
                          name="amount"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Amount</FormLabel>
                                  <FormControl>
                                      <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency.symbol}</span>
                                          <Input type="number" step="0.01" placeholder="0.00" {...field} onFocus={e => e.target.select()} className="pl-8" />
                                      </div>
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <DialogFooter>
                          <Button type="submit">Update Balance</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>

    </div>
  );
}
