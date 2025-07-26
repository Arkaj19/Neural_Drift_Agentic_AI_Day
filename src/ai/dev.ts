import { config } from 'dotenv';
config();

import '@/ai/flows/detect-incidents.ts';
import '@/ai/flows/predict-crowding.ts';
import '@/ai/flows/summarize-alerts.ts';
import '@/ai/flows/crowd-management-chatbot.ts';
