
'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Phone, AlertTriangle, Image as ImageIcon, X, Bell, BellRing, Send, Bot, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import type { Grievance } from '@/app/(app)/grievances/page';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { grievanceChatbot } from '@/ai/flows/grievance-chatbot';


export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    phone: string;
}

interface Notification {
  id: string;
  message: string;
  createdAt: {
    seconds: number;
  };
  read: boolean;
}

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

function MissingPersonsCarousel({ reports }: { reports: Grievance[] }) {
  if (reports.length === 0) {
    return null;
  }

  const formatTimestamp = (timestamp: { seconds: number }) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="border-yellow-500 bg-yellow-900/10 mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-400">
          <AlertTriangle /> Missing Person Alerts
        </CardTitle>
        <CardDescription>
          Please be on the lookout for the following individuals. If seen, please report to the nearest security personnel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{
            align: "start",
            loop: reports.length > 1,
          }}
        >
          <CarouselContent>
            {reports.map((report) => (
              <CarouselItem key={report.id}>
                <div className="p-1">
                  <Card className="bg-background/50">
                    <CardHeader>
                        <CardTitle>{report.personName}</CardTitle>
                        <CardDescription>
                            Reported by {report.submittedBy} • {report.submittedAt ? formatTimestamp(report.submittedAt) : 'a few moments ago'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-4 text-sm">
                      {report.photoDataUri ? (
                        <div className="relative aspect-square w-32 h-32 rounded-md overflow-hidden flex-shrink-0">
                          <Image src={report.photoDataUri} alt={report.personName || 'Missing person'} layout="fill" objectFit="cover" />
                        </div>
                      ) : (
                         <div className="aspect-square w-32 h-32 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                         </div>
                      )}
                      <div className='grid gap-2'>
                        <div>
                          <p className="font-semibold">Last Seen</p>
                          <p className="text-muted-foreground">{report.lastSeen}</p>
                        </div>
                         <div>
                          <p className="font-semibold">Details</p>
                          <p className="text-muted-foreground">{report.details}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {reports.length > 1 && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
      </CardContent>
    </Card>
  );
}

function UserProfileDisplay({ user, loading }: { user: UserProfile | null, loading: boolean }) {
    if (loading) {
        return <Skeleton className="h-24 w-full mb-6" />;
    }

    if (!user) {
        return (
            <Card className="mb-6">
                <CardContent className="p-4 text-center text-muted-foreground">
                    Could not load user profile. Please log in again.
                </CardContent>
            </Card>
        );
    }

    const getInitials = (name: string) => {
        if (!name) return '';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <Card className="mb-6 overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl">
                        {getInitials(user.fullName)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                        <h3 className="text-xl font-bold">{user.fullName}</h3>
                        <p className="text-sm text-muted-foreground">Welcome back!</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                    </div>
                     <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{user.phone}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function Notifications({ user }: { user: UserProfile | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db, "notifications"),
      where("userEmail", "==", user.email),
      where("read", "==", false)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    const notifRef = doc(db, "notifications", id);
    try {
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({ title: "Error", description: "Could not dismiss notification.", variant: "destructive" });
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><BellRing /> Notifications</h2>
      {notifications.map((notif) => (
        <Alert key={notif.id} variant="default" className="border-accent">
          <Bell className="h-4 w-4" />
          <AlertTitle>Update on your request</AlertTitle>
          <AlertDescription>{notif.message}</AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => markAsRead(notif.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}

function GrievanceChatbot({ user }: { user: UserProfile }) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Hello! I'm the Drishti AI assistant. How can I help you today? You can report a medical issue, a missing person, or any other concern." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent, messageContent?: string) => {
        e.preventDefault();
        const content = messageContent || input;
        if (!content.trim() || loading) return;

        const newUserMessage: ChatMessage = { role: 'user', content };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await grievanceChatbot({
                history: [...messages, newUserMessage],
                user: { fullName: user.fullName, email: user.email }
            });
            setMessages(prev => [...prev, { role: 'model', content: response }]);
        } catch (error) {
            console.error("Error with chatbot:", error);
            setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const photoDataUri = reader.result as string;
                const messageWithPhoto = `Here is the photo: [image attached]`;
                handleSendMessage(e, messageWithPhoto + `\n${photoDataUri}`);
            };
            reader.readAsDataURL(file);
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot /> AI Assistant
                </CardTitle>
                <CardDescription>Report an issue by chatting with our AI assistant.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] overflow-y-auto p-4 border rounded-md mb-4 bg-muted/20 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <Avatar className="w-8 h-8"><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                            <div className={`rounded-lg px-4 py-2 max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                <p className="text-sm">{msg.content.split('\n')[0]}</p>
                            </div>
                            {msg.role === 'user' && <Avatar className="w-8 h-8"><AvatarFallback><User /></AvatarFallback></Avatar>}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start gap-3 justify-start">
                             <Avatar className="w-8 h-8"><AvatarFallback><Bot /></AvatarFallback></Avatar>
                             <div className="rounded-lg px-4 py-2 max-w-[80%] bg-background">
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={loading}
                    />
                     <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                        <ImageIcon className="h-4 w-4" />
                        <span className="sr-only">Upload Image</span>
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <Button type="submit" disabled={loading}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function UserDashboardPage() {
  const [missingPersonReports, setMissingPersonReports] = useState<Grievance[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const loggedInUserEmail = localStorage.getItem('userEmail');

    const fetchUser = async (email: string) => {
        setLoadingUser(true);
        try {
            const q = query(collection(db, "users"), where("email", "==", email), limit(1));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data() as Omit<UserProfile, 'id'>;
                setUser({ id: userDoc.id, ...userData });
            } else {
                 console.log("No such user!");
                 setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUser(null);
        } finally {
            setLoadingUser(false);
        }
    };

    if (loggedInUserEmail) {
        fetchUser(loggedInUserEmail);
    } else {
        setLoadingUser(false); 
    }

    const qGrievances = query(collection(db, "grievances"), where("type", "==", "Missing Person"), where("status", "==", "new"));
    const unsubscribeGrievances = onSnapshot(qGrievances, (querySnapshot) => {
      const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grievance));
      setMissingPersonReports(reports);
    });

    return () => unsubscribeGrievances();
  }, []);

  return (
    <div className="space-y-4">
        <UserProfileDisplay user={user} loading={loadingUser} />
        <Notifications user={user} />
        <MissingPersonsCarousel reports={missingPersonReports} />
        
        {loadingUser ? (
            <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-96 w-full" />
                </CardContent>
            </Card>
        ) : user ? (
            <GrievanceChatbot user={user} />
        ) : (
             <Card>
                <CardHeader>
                    <CardTitle>Please Log In</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You must be logged in to report an issue.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}

