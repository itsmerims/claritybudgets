'use server';

/**
 * @fileOverview Automatically categorizes expenses using AI.
 *
 * - autoCategorizeExpense - A function that automatically categorizes an expense.
 * - AutoCategorizeExpenseInput - The input type for the autoCategorizeExpense function.
 * - AutoCategorizeExpenseOutput - The return type for the autoCategorizeExpense function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoCategorizeExpenseInputSchema = z.object({
  description: z.string().describe('The description of the expense.'),
});
export type AutoCategorizeExpenseInput = z.infer<typeof AutoCategorizeExpenseInputSchema>;

const AutoCategorizeExpenseOutputSchema = z.object({
  category: z.string().describe('The predicted category of the expense.'),
  confidence: z.number().describe('The confidence level of the categorization (0-1).'),
});
export type AutoCategorizeExpenseOutput = z.infer<typeof AutoCategorizeExpenseOutputSchema>;

export async function autoCategorizeExpense(input: AutoCategorizeExpenseInput): Promise<AutoCategorizeExpenseOutput> {
  return autoCategorizeExpenseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoCategorizeExpensePrompt',
  input: {schema: AutoCategorizeExpenseInputSchema},
  output: {schema: AutoCategorizeExpenseOutputSchema},
  prompt: `You are a personal finance expert.  Given the description of an expense, you will determine the most appropriate category for it.

Description: {{{description}}}

Respond with the category and a confidence level (0-1).`,
});

const autoCategorizeExpenseFlow = ai.defineFlow(
  {
    name: 'autoCategorizeExpenseFlow',
    inputSchema: AutoCategorizeExpenseInputSchema,
    outputSchema: AutoCategorizeExpenseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
