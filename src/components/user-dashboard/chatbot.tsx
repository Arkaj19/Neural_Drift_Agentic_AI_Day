'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Send, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { crowdManagementChatbot, type CrowdManagementChatbotOutput, type CrowdManagementChatbotInput } from '@/ai/flows/crowd-management-chatbot';
import { nanoid } from 'nanoid';
import { type MissingPersonFormData } from './missing-person-form';

interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    text: string;
}

type MissingPersonData = CrowdManagementChatbotInput['missingPersonData'];

interface ChatbotProps {
    handleNavigation: (path: string, tab?: string) => void;
    handlePrefillAndNavigate: (data: Partial<MissingPersonFormData>) => void;
}

export default function Chatbot({ handleNavigation, handlePrefillAndNavigate }: ChatbotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [missingPersonData, setMissingPersonData] = useState<MissingPersonData>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        setMessages([{ id: nanoid(), role: 'bot', text: "Hello! I can help with medical emergencies, missing persons reports, and venue directions. How can I assist you?" }]);
    }, []);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = { id: nanoid(), role: 'user', text: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const result: CrowdManagementChatbotOutput = await crowdManagementChatbot({ 
                query: input,
                history: messages,
                missingPersonData: missingPersonData,
            });

            const botMessage: ChatMessage = { id: nanoid(), role: 'bot', text: result.response };
            setMessages(prev => [...prev, botMessage]);
            
            if (result.updatedMissingPersonData) {
                setMissingPersonData(result.updatedMissingPersonData);
            }

            if (result.action) {
                switch (result.action) {
                    case 'NAVIGATE_TO_EMERGENCY_FORM':
                        handleNavigation('user/dashboard', 'medical');
                        break;
                    case 'NAVIGATE_TO_MAP':
                        handleNavigation('/map-view');
                        break;
                    case 'PREFILL_MISSING_PERSON_FORM':
                         if (result.updatedMissingPersonData) {
                            handlePrefillAndNavigate({
                                personName: result.updatedMissingPersonData.personName,
                                lastSeenLocation: result.updatedMissingPersonData.lastSeenLocation,
                                details: result.updatedMissingPersonData.description,
                            });
                        }
                        // Reset for next conversation
                        setMissingPersonData({});
                        break;
                }
            }
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: ChatMessage = { id: nanoid(), role: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <CardHeader className="px-1 pt-4">
                <CardTitle>Drishti Assistant</CardTitle>
                <CardDescription>Ask for help or directions. I can also help you file a missing person report.</CardDescription>
            </CardHeader>
            <CardContent className="px-1">
                <div className="h-[400px] flex flex-col">
                    <div className="flex-grow space-y-4 overflow-y-auto p-4 border rounded-md bg-muted/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex items-end gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                {msg.role === 'bot' && <Avatar className="w-8 h-8"><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                                <div className={cn(
                                    "max-w-md rounded-lg px-4 py-2 whitespace-pre-wrap shadow-sm",
                                     msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none'
                                )}>
                                    {msg.text}
                                </div>
                                 {msg.role === 'user' && <Avatar className="w-8 h-8"><AvatarFallback><User /></AvatarFallback></Avatar>}
                            </div>
                        ))}
                        {loading && (
                            <div className="flex items-end gap-3 justify-start">
                                <Avatar className="w-8 h-8"><AvatarFallback><Bot /></AvatarFallback></Avatar>
                                <div className="max-w-xs rounded-lg px-4 py-2 whitespace-pre-wrap shadow-sm bg-background rounded-bl-none">
                                    <Skeleton className="h-4 w-10" />
                                </div>
                            </div>
                        )}
                         <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleChatSubmit} className="flex items-center gap-2 pt-4">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={loading}
                        />
                        <Button type="submit" disabled={loading} size="icon">
                           <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </div>
    );
}
