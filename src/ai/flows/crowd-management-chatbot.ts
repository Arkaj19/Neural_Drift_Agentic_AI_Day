'use server';
/**
 * @fileOverview A conversational chatbot for crowd management that can guide users through reporting a missing person.
 *
 * - crowdManagementChatbot - A function that handles the chatbot logic.
 * - CrowdManagementChatbotInput - The input type for the chatbot function.
 * - CrowdManagementChatbotOutput - The return type for the chatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define Zod schemas but do not export them to comply with 'use server' constraints.
const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'bot']),
  text: z.string(),
});

const CrowdManagementChatbotInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The conversation history.'),
  query: z.string().describe('The latest user query to the chatbot.'),
});
export type CrowdManagementChatbotInput = z.infer<typeof CrowdManagementChatbotInputSchema>;

const CrowdManagementChatbotOutputSchema = z.object({
  category: z.enum(['MEDICAL_EMERGENCY', 'MISSING_PERSON', 'MAP_DIRECTIONS', 'DEFAULT']).describe('The category of the user query.'),
  response: z.string().describe('The chatbot response to the user.'),
  action: z.enum(['NAVIGATE_TO_EMERGENCY_FORM', 'NAVIGATE_TO_MISSING_PERSON_FORM', 'SHOW_USER_MAP']).nullable().describe('The navigation or prefill action to be taken by the frontend.'),
});
export type CrowdManagementChatbotOutput = z.infer<typeof CrowdManagementChatbotOutputSchema>;

export async function crowdManagementChatbot(input: CrowdManagementChatbotInput): Promise<CrowdManagementChatbotOutput> {
  return crowdManagementChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'crowdManagementChatbotPrompt',
  input: {schema: CrowdManagementChatbotInputSchema},
  output: {schema: CrowdManagementChatbotOutputSchema},
  prompt: `You are a helpful and empathetic crowd management chatbot. Your primary goal is to triage user requests and provide immediate, scannable responses.

  Here are your main tasks:
  1.  **Triage Initial Request:** Classify the user's message into one of the main categories.
  2.  **Provide Clear Responses:** Use emojis for quick recognition. Keep responses under 20 words. Be direct and helpful.

  **Categories & Actions:**
  - **MEDICAL_EMERGENCY:**
    Keywords: medical, emergency, help, injured, accident, hurt, sick, doctor, ambulance, collapsed, unconscious, bleeding, pain
    Response: "🚨 MEDICAL EMERGENCY: Call 108 immediately! Opening Emergency Form to log your location. Medical team dispatched."
    Action: NAVIGATE_TO_EMERGENCY_FORM
  - **MISSING_PERSON:**
    Keywords: missing, lost, can't find, disappeared, lost child, separated, where is
    Response: "📞 MISSING PERSON: Opening Missing Person Form. Security alerted immediately. Provide name, age, last location, clothing."
    Action: NAVIGATE_TO_MISSING_PERSON_FORM
  - **MAP_DIRECTIONS:**
    Keywords: where, exit, washroom, toilet, food, parking, directions, map, location, gate
    Response: "🗺️ DIRECTIONS: Opening venue map to show locations of exits, washrooms, food courts, and parking areas."
    Action: SHOW_USER_MAP
  - **DEFAULT (No Match):**
    Response: "I help with:\n🚨 Medical emergencies\n👥 Missing persons\n🗺️ Map & directions\nWhat do you need?"
    Action: null

  **Current Conversation State:**
  - History: The user's conversation history is provided in the input. Use it for context.
  - User's Latest Message: {{{query}}}

  Analyze the user's message based on the history and current data, and respond with the appropriate JSON object. For DEFAULT category, action must be null.
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
