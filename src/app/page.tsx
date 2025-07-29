
import { Button } from '@/components/ui/button';
import { Sprout } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <h1 className="flex items-center gap-2 text-lg font-semibold md:text-2xl">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="font-headline">ClarityBudgets</span>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Financial Clarity, Effortlessly.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Take control of your finances with smart budgeting, AI-powered insights, and simple expense tracking.
                  ClarityBudgets helps you understand your spending and achieve your financial goals.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg">
                  <Link href="/signup">Get Started for Free</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
       <footer className="flex items-center justify-center p-4 border-t">
        <p className="text-sm text-muted-foreground">Made with ❤️ by you</p>
      </footer>
    </div>
  );
}
