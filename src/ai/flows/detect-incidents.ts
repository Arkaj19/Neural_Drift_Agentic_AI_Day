// detect-incidents.ts
'use server';
/**
 * @fileOverview An AI agent that detects incidents such as violence or excessive crowding from camera feeds and generates alerts with priority levels.
 *
 * - detectIncidents - A function that handles the incident detection process.
 * - DetectIncidentsInput - The input type for the detectIncidents function.
 * - DetectIncidentsOutput - The return type for the detectIncidents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectIncidentsInputSchema = z.object({
  cameraId: z.string().describe('The ID of the camera feed being analyzed.'),
  cameraLocation: z.string().describe('The location of the camera.'),
  videoDataUri: z
    .string()
    .describe(
      "A snippet of the video feed from the camera, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectIncidentsInput = z.infer<typeof DetectIncidentsInputSchema>;

const DetectIncidentsOutputSchema = z.object({
  incidentType: z
    .string()
    .describe(
      'The type of incident detected (e.g., violence, crowding, etc.). If no incident is detected, this should be null.'
    )
    .nullable(),
  priority: z
    .string()
    .describe(
      'The priority level of the incident (e.g., high, medium, low). If no incident is detected, this should be null.'
    )
    .nullable(),
  description: z
    .string()
    .describe(
      'A brief description of the incident. If no incident is detected, this should be null.'
    )
    .nullable(),
});

export type DetectIncidentsOutput = z.infer<typeof DetectIncidentsOutputSchema>;

export async function detectIncidents(input: DetectIncidentsInput): Promise<DetectIncidentsOutput> {
  return detectIncidentsFlow(input);
}

const detectIncidentsPrompt = ai.definePrompt({
  name: 'detectIncidentsPrompt',
  input: {schema: DetectIncidentsInputSchema},
  output: {schema: DetectIncidentsOutputSchema},
  prompt: `You are an AI-powered security analyst responsible for monitoring live camera feeds and detecting potential incidents.

  Analyze the provided video feed and identify any incidents such as violence, excessive crowding, or other security concerns.
  Based on the detected incident, determine the appropriate priority level (high, medium, or low) and provide a brief description.
  If no incident is detected, set the incidentType, priority and description output fields to null.

  Camera ID: {{{cameraId}}}
  Camera Location: {{{cameraLocation}}}
  Video Feed: {{media url=videoDataUri}}

  Respond with a JSON object containing the incident type, priority, and description.
  `,
});

const detectIncidentsFlow = ai.defineFlow(
  {
    name: 'detectIncidentsFlow',
    inputSchema: DetectIncidentsInputSchema,
    outputSchema: DetectIncidentsOutputSchema,
  },
  async input => {
    const {output} = await detectIncidentsPrompt(input);
    return output!;
  }
);
