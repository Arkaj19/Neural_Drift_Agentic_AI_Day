'use server';

import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Tool schema for creating a grievance
const CreateGrievanceSchema = z.object({
  type: z.enum(['Medical Attention', 'Missing Person', 'General Grievance']),
  details: z.string().describe('A detailed description of the grievance.'),
  location: z
    .string()
    .optional()
    .describe('The location for a medical attention request.'),
  personName: z
    .string()
    .optional()
    .describe("The name of the missing person."),
  lastSeen: z
    .string()
    .optional()
    .describe('The last known location and time of the missing person.'),
  photoDataUri: z
    .string()
    .optional()
    .describe(
      'A photo of the missing person as a data URI. This will be provided in the chat history if uploaded by the user.'
    ),
});

export const createGrievance = ai.defineTool(
  {
    name: 'createGrievance',
    description: 'Use this tool to create a new grievance report in the system.',
    inputSchema: CreateGrievanceSchema,
    outputSchema: z.object({
      success: z.boolean(),
      grievanceId: z.string(),
    }),
  },
  async (input, context) => {
    if (!context?.submittedBy || !context?.email) {
      throw new Error('User information is missing.');
    }

    try {
      const docRef = await addDoc(collection(db, 'grievances'), {
        ...input,
        status: 'new',
        submittedAt: serverTimestamp(),
        submittedBy: context.submittedBy as string,
        email: context.email as string,
      });

      console.log('Grievance created with ID:', docRef.id);
      return { success: true, grievanceId: docRef.id };
    } catch (error) {
      console.error('Error creating grievance:', error);
      return {
        success: false,
        grievanceId: '',
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }
);
