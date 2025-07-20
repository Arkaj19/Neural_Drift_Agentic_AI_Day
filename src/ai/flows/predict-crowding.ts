'use server';

/**
 * @fileOverview Predicts areas of future crowding to proactively direct security staff.
 *
 * - predictCrowding - A function that predicts areas of future crowding.
 * - PredictCrowdingInput - The input type for the predictCrowding function.
 * - PredictCrowdingOutput - The return type for the predictCrowding function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictCrowdingInputSchema = z.object({
  sectorData: z.array(
    z.object({
      sectorId: z.string().describe('The ID of the sector.'),
      currentCount: z.number().describe('The current crowd count in the sector.'),
      capacity: z.number().describe('The maximum capacity of the sector.'),
      historicalData: z.array(z.number()).describe('Historical crowd counts for the sector.'),
    })
  ).describe('An array of sector data including current and historical crowd counts.'),
  eventDetails: z.string().describe('Details about the event, such as type of event, expected attendance, and any special circumstances.'),
});
export type PredictCrowdingInput = z.infer<typeof PredictCrowdingInputSchema>;

const PredictCrowdingOutputSchema = z.array(
  z.object({
    sectorId: z.string().describe('The ID of the sector.'),
    predictedCrowd: z.number().describe('The predicted crowd count in the sector.'),
    riskLevel: z.enum(['low', 'medium', 'high']).describe('The risk level of crowding in the sector.'),
    recommendations: z.string().describe('Recommendations for managing potential crowding in the sector.'),
  })
).describe('An array of predicted crowd levels, risk assessments, and recommendations for each sector.');
export type PredictCrowdingOutput = z.infer<typeof PredictCrowdingOutputSchema>;

export async function predictCrowding(input: PredictCrowdingInput): Promise<PredictCrowdingOutput> {
  return predictCrowdingFlow(input);
}

const predictCrowdingPrompt = ai.definePrompt({
  name: 'predictCrowdingPrompt',
  input: {schema: PredictCrowdingInputSchema},
  output: {schema: PredictCrowdingOutputSchema},
  prompt: `You are an AI-powered event safety analyst. You will analyze sector crowd data and event details to predict future crowding and provide recommendations.

Analyze the following sector data and event details:

Sectors Data: {{{sectorData}}}

Event Details: {{{eventDetails}}}

Based on this information, predict the crowd level for each sector and provide a risk assessment (low, medium, high) and recommendations for managing potential crowding. The output must be in JSON format.`, 
});

const predictCrowdingFlow = ai.defineFlow(
  {
    name: 'predictCrowdingFlow',
    inputSchema: PredictCrowdingInputSchema,
    outputSchema: PredictCrowdingOutputSchema,
  },
  async input => {
    const {output} = await predictCrowdingPrompt(input);
    return output!;
  }
);
