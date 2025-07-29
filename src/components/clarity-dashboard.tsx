"use client";

import { autoCategorizeExpense } from "@/ai/flows/auto-categorize-expense";
import { generateSavingTips } from "@/ai/flows/generate-saving-tips";
import { initialBudgets, initialCategories, initialExpenses } from "@/lib/data";
import type { Budget, Category, Expense } from "@/lib/types";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DollarSign,
  Landmark,
  Lightbulb,
  Loader2,
  PieChart as PieChartIcon,
  Plus,
  Sprout,
  TrendingUp,
  Wallet,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  categoryId: z.string().min(1, "Category is required."),
  date: z.string().min(1, "Date is required."),
});

const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
});

export default function ClarityDashboard() {
  const { toast } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Hydration fix
  useEffect(() => {
    setExpenses(initialExpenses);
    setBudgets(initialBudgets);
  }, []);
  

  const [isExpenseDialogOpen, setExpenseDialogOpen] = useState(false);
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

  const { totalSpent, totalBudget, remainingBudget } = useMemo(() => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalBudget = budgets.reduce((sum, bud) => sum + bud.amount, 0);
    const remainingBudget = totalBudget - totalSpent;
    return { totalSpent, totalBudget, remainingBudget };
  }, [expenses, budgets]);

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
      fill: `var(--color-${name.toLowerCase().replace(/ /g, "-")})`,
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
      description: `${values.description} for $${values.amount} has been logged.`,
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
      } set to $${values.amount}.`,
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
      const result = await autoCategorizeExpense({ description });
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
      const spendingHabits = JSON.stringify(spendingByCategory, null, 2);
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold md:text-2xl">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="font-headline">ClarityBudgets</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
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
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-8"/>
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
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-8"/>
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
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
              <DollarSign className="h-5 w-5" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-headline">
              ${totalSpent.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
              <Landmark className="h-5 w-5" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-headline">
              ${totalBudget.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className={cn("md:col-span-1 lg:col-span-1", remainingBudget < 0 ? 'bg-destructive/10 border-destructive/50' : '')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
              <Wallet className="h-5 w-5" />
              Remaining Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-headline">
              ${remainingBudget.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
              <TrendingUp className="h-5 w-5" />
              Budget Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetProgress.length > 0 ? (
              budgetProgress.map((budget) => (
                <div key={budget.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{budget.categoryName}</span>
                    <span className="text-muted-foreground">
                      ${budget.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
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
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  strokeWidth={5}
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
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Here are your tips!</AlertTitle>
                <AlertDescription className="whitespace-pre-line">
                  {savingTips}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate tips from our AI financial assistant.
                </p>
                <Button onClick={handleGenerateSavingTips} disabled={expenses.length === 0}>
                  Generate Tips
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest logged expenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                      <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
