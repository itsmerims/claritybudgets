// A Genkit flow that generates personalized saving tips based on spending habits.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSavingTipsInputSchema = z.object({
  spendingHabits: z
    .string()
    .describe(
      'A detailed summary of the user\'s spending habits, including categories and amounts.'
    ),
});

export type GenerateSavingTipsInput =
  z.infer<typeof GenerateSavingTipsInputSchema>;

const GenerateSavingTipsOutputSchema = z.object({
  savingTips: z
    .string()
    .describe(
      'A list of personalized saving tips based on the user\'s spending habits.'
    ),
});

export type GenerateSavingTipsOutput =
  z.infer<typeof GenerateSavingTipsOutputSchema>;

export async function generateSavingTips(
  input: GenerateSavingTipsInput
): Promise<GenerateSavingTipsOutput> {
  return generateSavingTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSavingTipsPrompt',
  input: {schema: GenerateSavingTipsInputSchema},
  output: {schema: GenerateSavingTipsOutputSchema},
  prompt: `You are a personal finance advisor. Based on the user's spending habits, provide personalized saving tips.

Spending Habits: {{{spendingHabits}}}

Saving Tips:`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateSavingTipsFlow = ai.defineFlow(
  {
    name: 'generateSavingTipsFlow',
    inputSchema: GenerateSavingTipsInputSchema,
    outputSchema: GenerateSavingTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
