'use server';
/**
 * @fileOverview A flow to summarize the real-time status of the event dashboard.
 *
 * - summarizeDashboard - A function that generates a summary of guards, alerts, and grievances.
 * - SummarizeDashboardInput - The input type for the summarizeDashboard function.
 * - SummarizeDashboardOutput - The return type for the summarizeDashboard function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GuardSchema = z.object({
  id: z.string(),
  name: z.string(),
  sector: z.string(),
  status: z.enum(['Active', 'Alert', 'Standby']),
  phone: z.string(),
});

const AlertSchema = z.object({
  feed_id: z.string(),
  feed_name: z.string(),
  alert_level: z.enum(['critical', 'warning', 'normal', 'predicted']),
  current_count: z.number(),
  timestamp: z.string(),
  recommendations: z.string().optional(),
});

const GrievanceSchema = z.object({
    id: z.string(),
    type: z.enum(['Medical Attention', 'Missing Person', 'General Grievance']),
    details: z.string(),
    submittedAt: z.object({
        seconds: z.number(),
        nanoseconds: z.number(),
    }),
    status: z.enum(['new', 'resolved']),
    submittedBy: z.string().optional(),
});


const SummarizeDashboardInputSchema = z.object({
  guards: z.array(GuardSchema).describe("List of security guards and their statuses."),
  alerts: z.array(AlertSchema).describe("List of active and predicted alerts."),
  grievances: z.array(GrievanceSchema).describe("List of open user-submitted grievances."),
});
export type SummarizeDashboardInput = z.infer<typeof SummarizeDashboardInputSchema>;

const SummarizeDashboardOutputSchema = z.object({
  summary: z.string().describe("A concise, human-readable summary of the current event status."),
});
export type SummarizeDashboardOutput = z.infer<typeof SummarizeDashboardOutputSchema>;

export async function summarizeDashboard(input: SummarizeDashboardInput): Promise<SummarizeDashboardOutput> {
  return summarizeDashboardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDashboardPrompt',
  input: { schema: SummarizeDashboardInputSchema },
  output: { schema: SummarizeDashboardOutputSchema },
  prompt: `You are an AI event command center analyst. Your task is to provide a concise, high-level summary of the current event status based on the data provided.

Focus on the most critical information first. Structure your summary into three sections: Alerts, Grievances, and Guard Status. Use bullet points for readability.

**Current Data:**

**Active & Predicted Alerts:**
{{#if alerts.length}}
{{#each alerts}}
- **{{feed_name}}**: {{alert_level.toUpperCase}} alert with a count of {{current_count}}.{{#if recommendations}} Recommendation: {{recommendations}}{{/if}}
{{/each}}
{{else}}
- No active alerts. All sectors are operating normally.
{{/if}}

**Open Grievances:**
{{#if grievances.length}}
{{#each grievances}}
- **{{type}}**: "{{details}}" reported by {{submittedBy}}.
{{/each}}
{{else}}
- No open grievances from attendees.
{{/if}}

**Guard Status:**
{{#if guards.length}}
- {{guards.length}} guards are on duty.
- Active guards: {{guards.filter(g => g.status === 'Active').length}}
- Guards on standby: {{guards.filter(g => g.status === 'Standby').length}}
- Guards in alert status: {{guards.filter(g => g.status === 'Alert').length}}
{{else}}
- No guard data available.
{{/if}}

**Instructions:**
Generate a summary paragraph based on the data above. Highlight the most urgent issues first.
`,
});


const summarizeDashboardFlow = ai.defineFlow(
  {
    name: 'summarizeDashboardFlow',
    inputSchema: SummarizeDashboardInputSchema,
    outputSchema: SummarizeDashboardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
