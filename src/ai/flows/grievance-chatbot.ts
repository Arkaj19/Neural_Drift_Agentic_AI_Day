'use server';
/**
 * @fileOverview A chatbot for handling user grievances.
 *
 * - grievanceChatbot - A function that handles the conversation for reporting grievances.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createGrievance } from '@/services/grievance-service';

// Define the schema for a single chat message
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

export const GrievanceChatbotInputSchema = z.object({
  history: z.array(ChatMessageSchema),
  user: z.object({
    fullName: z.string(),
    email: z.string(),
  }),
});
export type GrievanceChatbotInput = z.infer<typeof GrievanceChatbotInputSchema>;

export async function grievanceChatbot(
  input: GrievanceChatbotInput
): Promise<string> {
  const grievanceTools = [createGrievance];

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    tools: grievanceTools,
    prompt: `You are a friendly and helpful AI assistant for the Drishti AI Event Guardian platform. Your role is to help event attendees report grievances.

    Your personality should be calm, reassuring, and professional.

    You are in a chat conversation with a user. Their information is:
    - Name: ${input.user.fullName}
    - Email: ${input.user.email}

    Here is the conversation history so far:
    ${input.history.map((message) => `${message.role}: ${message.content}`).join('\n')}

    Your task is to:
    1.  Understand the user's need. They can report 'Medical Attention', 'Missing Person', or 'General Grievance'.
    2.  If the user's intent isn't clear, ask clarifying questions.
    3.  Once the intent is clear, ask for the necessary information to file a report using the 'createGrievance' tool.
        - For **Medical Attention**, you MUST ask for their current location.
        - For **Missing Person**, you MUST ask for the person's name, last seen location/time, and a description. You can also ask for a photo, which the user can upload. The photo will be provided as a data URI in the chat history.
        - For **General Grievance**, you just need the details of the issue.
    4.  Do NOT call the 'createGrievance' tool until you have all the necessary information for the specific grievance type. For example, for a missing person, you need their name and last seen details.
    5.  After calling the tool successfully, confirm to the user that their report has been filed and that help is on the way or that staff has been notified.
    6.  Keep your responses concise and clear.
    `,
    toolConfig: {
      // Pass user info to the tool automatically
      context: {
        submittedBy: input.user.fullName,
        email: input.user.email,
      },
    },
  });

  if (output?.text) {
    return output.text;
  }

  if (output?.toolRequests) {
    const toolResponses = await Promise.all(
      output.toolRequests.map((toolRequest) =>
        ai.runTool(toolRequest)
      )
    );

    const { output: finalOutput } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `You are a helpful AI assistant. You have just successfully used a tool to create a grievance report for the user. Inform them that their report has been submitted and that the event staff has been notified. Keep the message concise and reassuring.`,
        history: [...input.history, {role: 'model', content: ''}],
        toolResponse: toolResponses[0],
    });

    return finalOutput?.text || 'Your report has been submitted successfully. Event staff will be in touch shortly.';
  }

  return "I'm sorry, I'm having trouble understanding. Could you please rephrase?";
}
