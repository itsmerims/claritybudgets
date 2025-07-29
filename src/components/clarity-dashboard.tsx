"use client";

import { autoCategorizeExpense } from "@/ai/flows/auto-categorize-expense";
import { generateSavingTips } from "@/ai/flows/generate-saving-tips";
import { initialCategories, currencies } from "@/lib/data";
import type { Budget, Category, Expense, Currency, Income } from "@/lib/types";
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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Pie, PieChart, ResponsiveContainer, Cell, Legend } from "recharts";
import { z } from "zod";

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function ClarityDashboard() {
  const { toast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currency, setCurrency] = useState<Currency>(currencies[0]);

  useEffect(() => {
    setIsMounted(true);
    const savedCurrency = localStorage.getItem("clarity-currency");
    if (savedCurrency) {
      const foundCurrency = currencies.find(c => c.code === savedCurrency);
      if (foundCurrency) {
        setCurrency(foundCurrency);
      }
    }
  }, []);

  useEffect(() => {
    if(isMounted) {
      localStorage.setItem("clarity-currency", currency.code);
    }
  }, [currency, isMounted]);

  const [isExpenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setBudgetDialogOpen] = useState(false);
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
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      ...values,
    };
    setExpenses([newExpense, ...expenses]);
    expenseForm.reset();
    setExpenseDialogOpen(false);
    toast({
      title: "Expense Added",
      description: `${values.description} for ${currency.symbol}${values.amount} has been logged.`,
    });
  }
  
  async function handleAddIncome(values: z.infer<typeof incomeSchema>) {
    const newIncome: Income = {
      id: `inc-${Date.now()}`,
      ...values,
    };
    setIncomes([newIncome, ...incomes]);
    incomeForm.reset();
    setIncomeDialogOpen(false);
    toast({
      title: "Income Added",
      description: `${values.description} for ${currency.symbol}${values.amount} has been logged.`,
    });
  }

  async function handleAddBudget(values: z.infer<typeof budgetSchema>) {
    const existingBudgetIndex = budgets.findIndex(
      (b) => b.categoryId === values.categoryId
    );
    if (existingBudgetIndex > -1) {
      const updatedBudgets = [...budgets];
      updatedBudgets[existingBudgetIndex].amount = values.amount;
      setBudgets(updatedBudgets);
    } else {
      const newBudget: Budget = {
        id: `bud-${Date.now()}`,
        ...values,
      };
      setBudgets([...budgets, newBudget]);
    }
    budgetForm.reset();
    setBudgetDialogOpen(false);
    toast({
      title: "Budget Set",
      description: `Budget for ${
        categoryMap[values.categoryId]?.name
      } set to ${currency.symbol}${values.amount}.`,
    });
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
        
      const spendingHabits = `Currency: ${currency.name} (${currency.code})\n${spendingSummary}`;

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

  if (!isMounted) {
    return null; // or a loading spinner
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold md:text-2xl">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="font-headline">ClarityBudgets</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
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
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground text-green-600">
              <DollarSign className="h-5 w-5" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-headline text-green-600">
              {currency.symbol}{totalIncome.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground text-red-600">
              <TrendingUp className="h-5 w-5" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-headline text-red-600">
              {currency.symbol}{totalSpent.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className={cn("md:col-span-1 lg:col-span-1", remainingBalance < 0 ? 'bg-destructive/10 border-destructive/50' : '')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
              <Wallet className="h-5 w-5" />
              Remaining Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-headline">
              {currency.symbol}{remainingBalance.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-1">
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

        <Card className="md:col-span-3 lg:col-span-2">
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
        
        <Card className="md:col-span-3 lg:col-span-2">
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

        <Card className="md:col-span-3 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="expenses">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="expenses">
                  <ArrowDown className="mr-2 h-4 w-4 text-red-500" /> Expenses
                </TabsTrigger>
                <TabsTrigger value="income">
                   <ArrowUp className="mr-2 h-4 w-4 text-green-500" /> Income
                </TabsTrigger>
              </TabsList>
              <TabsContent value="expenses">
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
                      expenses.slice(0, 5).map((expense) => (
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
              </TabsContent>
              <TabsContent value="income">
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
                      incomes.slice(0, 5).map((income) => (
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
