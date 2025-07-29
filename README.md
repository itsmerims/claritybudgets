# ClarityBudgets

ClarityBudgets is a focused, intelligent budgeting and expense tracking application designed to bring clarity to your personal finances. Built with Next.js and powered by AI, it offers a simple yet powerful way to manage your money.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FUSERNAME%2Fclaritybudgets&env=GEMINI_API_KEY&envDescription=Your%20Google%20AI%20API%20key%20for%20powering%20AI%20features.&project-name=claritybudgets&repository-name=claritybudgets)

**Important:** Before deploying, make sure to replace `USERNAME` in the deployment link above with your actual GitHub username.

## Features

*   **Expense & Income Tracking:** Easily log your daily expenses and income sources.
*   **Budget Management:** Set monthly budgets for different spending categories and track your progress.
*   **Visual Dashboard:** Get a clear overview of your financial health with an interactive dashboard, including a pie chart of your spending by category.
*   **Multi-Currency Support:** Select your preferred currency, and have it saved for future visits.
*   **AI-Powered Categorization:** Let AI automatically suggest categories for your expenses based on their descriptions.
*   **Personalized Saving Tips:** Receive intelligent, actionable tips from an AI assistant based on your spending habits.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **UI:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/)
*   **AI:** [Google AI (Gemini) via Genkit](https://firebase.google.com/docs/genkit)
*   **Forms:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   An API key for Google AI. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/claritybudgets.git
    cd claritybudgets
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project and add your Google AI API key:
    ```
    GEMINI_API_KEY=your_google_ai_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the result.

## Deployment

This app is optimized for deployment on [Vercel](https://vercel.com/).

1.  Push your code to a GitHub repository.
2.  Click the "Deploy with Vercel" button at the top of this README.
3.  Follow the instructions on Vercel, ensuring you add your `GEMINI_API_KEY` as an environment variable when prompted.
