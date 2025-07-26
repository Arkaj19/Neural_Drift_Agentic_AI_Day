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

const MissingPersonDataSchema = z.object({
    personName: z.string().optional(),
    lastSeenLocation: z.string().optional(),
    description: z.string().optional(),
});

const CrowdManagementChatbotInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The conversation history.'),
  query: z.string().describe('The latest user query to the chatbot.'),
  missingPersonData: MissingPersonDataSchema.optional().describe('Data collected for a missing person report.'),
});
export type CrowdManagementChatbotInput = z.infer<typeof CrowdManagementChatbotInputSchema>;

const CrowdManagementChatbotOutputSchema = z.object({
  category: z.enum(['MEDICAL_EMERGENCY', 'MISSING_PERSON', 'MAP_DIRECTIONS', 'DEFAULT', 'CONVERSATION']).describe('The category of the user query.'),
  response: z.string().describe('The chatbot response to the user.'),
  action: z.enum(['NAVIGATE_TO_EMERGENCY_FORM', 'NAVIGATE_TO_MISSING_PERSON_FORM', 'NAVIGATE_TO_MAP', 'PREFILL_MISSING_PERSON_FORM']).nullable().describe('The navigation or prefill action to be taken by the frontend.'),
  updatedMissingPersonData: MissingPersonDataSchema.optional().describe('The updated data for the missing person report after processing the query.'),
});
export type CrowdManagementChatbotOutput = z.infer<typeof CrowdManagementChatbotOutputSchema>;

export async function crowdManagementChatbot(input: CrowdManagementChatbotInput): Promise<CrowdManagementChatbotOutput> {
  return crowdManagementChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'crowdManagementChatbotPrompt',
  input: {schema: CrowdManagementChatbotInputSchema},
  output: {schema: CrowdManagementChatbotOutputSchema},
  prompt: `You are a helpful and empathetic crowd management chatbot. Your primary goal is to triage user requests and, for missing person reports, guide the user through collecting information step-by-step.

  Here are your main tasks:
  1.  **Triage Initial Request:** Classify the user's first message into one of the main categories.
  2.  **Conduct a Conversation for Missing Persons:** If the user reports a missing person, engage in a conversation to fill in the following details: personName, lastSeenLocation, description.
  3.  **Provide Clear Responses:** Use emojis and direct language. Keep responses concise.

  **Conversation Flow for Missing Person:**
  - If \`missingPersonData\` is empty or missing fields, your category should be \`CONVERSATION\`.
  - Ask for ONE piece of information at a time (Name -> Location -> Description).
  - Once you ask a question, STOP and wait for the user's response. Your response should just be the question.
  - Analyze the user's query to extract the information you asked for and update the \`updatedMissingPersonData\` object.
  - If the user provides information you didn't ask for, try to fill it into the correct field anyway.
  - Once all three fields (\`personName\`, \`lastSeenLocation\`, \`description\`) are filled, change the category to \`MISSING_PERSON\` and set the action to \`PREFILL_MISSING_PERSON_FORM\`. Your response should confirm that you have all the information and are opening the form.

  **Categories & Actions:**
  - **MEDICAL_EMERGENCY:**
    Keywords: medical, emergency, help, injured, accident, sick, doctor, ambulance, bleeding, pain
    Response: "🚨 MEDICAL EMERGENCY: I've noted the emergency. Opening the form to confirm your location."
    Action: NAVIGATE_TO_EMERGENCY_FORM
  - **MAP_DIRECTIONS:**
    Keywords: where, exit, washroom, food, parking, directions, map, location, gate
    Response: "🗺️ DIRECTIONS: Opening the venue map now."
    Action: NAVIGATE_TO_MAP
  - **MISSING_PERSON (Final Step):**
    Response: "Thank you. I have all the details. Opening the Missing Person form for you to review and submit."
    Action: PREFILL_MISSING_PERSON_FORM
  - **CONVERSATION (Ongoing):**
    Action: null. IMPORTANT: The action for this category MUST BE null.
  - **DEFAULT:**
    Response: "I can help with medical emergencies, missing person reports, and map directions. What do you need?"
    Action: null. IMPORTANT: The action for this category MUST BE null.

  **Current Conversation State:**
  - History: The user's conversation history is provided in the input. Use it for context.
  - Current Missing Person Data: {{{missingPersonData}}}
  - User's Latest Message: {{{query}}}

  Analyze the user's message based on the history and current data, and respond with the appropriate JSON object.
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
