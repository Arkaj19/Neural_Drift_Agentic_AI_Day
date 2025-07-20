// SummarizeAlerts
'use server';
/**
 * @fileOverview Summarizes alerts from an event for admin reports.
 *
 * - summarizeAlerts - A function that generates a summary report of alerts.
 * - SummarizeAlertsInput - The input type for the summarizeAlerts function.
 * - SummarizeAlertsOutput - The return type for the summarizeAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeAlertsInputSchema = z.object({
  alerts: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      severity: z.string(),
      sector: z.string(),
      timestamp: z.string(),
      description: z.string(),
      status: z.string(),
    })
  ).describe('An array of alerts to summarize.'),
});

export type SummarizeAlertsInput = z.infer<typeof SummarizeAlertsInputSchema>;

const SummarizeAlertsOutputSchema = z.object({
  summary: z.string().describe('A summary of the alerts, highlighting trends and areas of concern.'),
});

export type SummarizeAlertsOutput = z.infer<typeof SummarizeAlertsOutputSchema>;

export async function summarizeAlerts(input: SummarizeAlertsInput): Promise<SummarizeAlertsOutput> {
  return summarizeAlertsFlow(input);
}

const summarizeAlertsPrompt = ai.definePrompt({
  name: 'summarizeAlertsPrompt',
  input: {schema: SummarizeAlertsInputSchema},
  output: {schema: SummarizeAlertsOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing alerts from an event for an admin report.

  Analyze the following alerts and provide a concise summary, identifying any trends, areas of concern, and potential improvements for future events.

  Alerts:
  {{#each alerts}}
  - Type: {{type}}, Severity: {{severity}}, Sector: {{sector}}, Timestamp: {{timestamp}}, Description: {{description}}, Status: {{status}}
  {{/each}}
  `,
});

const summarizeAlertsFlow = ai.defineFlow(
  {
    name: 'summarizeAlertsFlow',
    inputSchema: SummarizeAlertsInputSchema,
    outputSchema: SummarizeAlertsOutputSchema,
  },
  async input => {
    const {output} = await summarizeAlertsPrompt(input);
    return output!;
  }
);
