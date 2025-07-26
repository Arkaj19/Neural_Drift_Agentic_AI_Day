'use server';
/**
 * @fileOverview A simple chatbot for crowd management that triages user requests.
 *
 * - crowdManagementChatbot - A function that handles the chatbot logic.
 * - CrowdManagementChatbotInput - The input type for the chatbot function.
 * - CrowdManagementChatbotOutput - The return type for the chatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const CrowdManagementChatbotInputSchema = z.object({
  query: z.string().describe('The user query to the chatbot.'),
});
export type CrowdManagementChatbotInput = z.infer<typeof CrowdManagementChatbotInputSchema>;

export const CrowdManagementChatbotOutputSchema = z.object({
  category: z.enum(['MEDICAL_EMERGENCY', 'MISSING_PERSON', 'MAP_DIRECTIONS', 'DEFAULT']).describe('The category of the user query.'),
  response: z.string().describe('The chatbot response to the user.'),
  action: z.enum(['NAVIGATE_TO_EMERGENCY_FORM', 'NAVIGATE_TO_MISSING_PERSON_FORM', 'NAVIGATE_TO_MAP']).nullable().describe('The navigation action to be taken by the frontend.'),
});
export type CrowdManagementChatbotOutput = z.infer<typeof CrowdManagementChatbotOutputSchema>;

export async function crowdManagementChatbot(input: CrowdManagementChatbotInput): Promise<CrowdManagementChatbotOutput> {
  return crowdManagementChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'crowdManagementChatbotPrompt',
  input: {schema: CrowdManagementChatbotInputSchema},
  output: {schema: CrowdManagementChatbotOutputSchema},
  prompt: `You are a crowd management chatbot. Your goal is to classify the user's query into one of the following categories and provide a specific, concise response and action.

  Categories and Keywords:
  1.  MEDICAL_EMERGENCY
      Keywords: medical, emergency, help, injured, accident, hurt, sick, doctor, ambulance, collapsed, unconscious, bleeding, pain
      Response: "🚨 MEDICAL EMERGENCY: Call 108 immediately! Opening Emergency Form to log your location. Medical team dispatched."
      Action: NAVIGATE_TO_EMERGENCY_FORM

  2.  MISSING_PERSON
      Keywords: missing, lost, can't find, disappeared, lost child, separated, where is
      Response: "📞 MISSING PERSON: Opening Missing Person Form. Security alerted immediately. Provide name, age, last location, clothing."
      Action: NAVIGATE_TO_MISSING_PERSON_FORM

  3.  MAP_DIRECTIONS
      Keywords: where, exit, washroom, toilet, food, parking, directions, map, location, gate
      Response: "🗺️ DIRECTIONS: Opening venue map to show locations of exits, washrooms, food courts, and parking areas."
      Action: NAVIGATE_TO_MAP

  4.  DEFAULT (No Match)
      Response: "I help with:\n🚨 Medical emergencies\n👥 Missing persons\n🗺️ Map & directions\nWhat do you need?"
      Action: null

  Rules:
  - Keep responses under 20 words.
  - Always include the Action for navigation if applicable.
  - Use emojis for quick recognition.
  - Be direct and helpful.
  - Analyze the user query and respond with the corresponding category, response, and action in JSON format.

  User Query: {{{query}}}
  `,
});

const crowdManagementChatbotFlow = ai.defineFlow(
  {
    name: 'crowdManagementChatbotFlow',
    inputSchema: CrowdManagementChatbotInputSchema,
    outputSchema: CrowdManagementChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
