
'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Phone, AlertTriangle, Image as ImageIcon, X, Bell, BellRing, Clock, Stethoscope, Search, MessageSquareWarning, Bot, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, getDocs, limit, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import type { Grievance } from '@/app/(app)/grievances/page';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createGrievance } from '@/services/grievance-service';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { crowdManagementChatbot, type CrowdManagementChatbotOutput } from '@/ai/flows/crowd-management-chatbot';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';


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

interface Location {
    name: string;
    area: string;
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
    <Card className="border-yellow-500 bg-yellow-400/20 dark:bg-yellow-900/20 mb-6 rounded-3xl shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <AlertTriangle /> Missing Person Alerts
        </CardTitle>
        <CardDescription className="text-yellow-800/80 dark:text-yellow-200/80">
          Please be on the lookout for the following individuals. If seen, please report to the nearest security personnel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{
            align: "start",
            loop: reports.length > 1,
          }}
          className="w-full"
        >
          <CarouselContent>
            {reports.map((report) => (
              <CarouselItem key={report.id}>
                <div className="p-1">
                  <Card className="bg-white/80 dark:bg-background/50 backdrop-blur-sm rounded-2xl">
                    <CardContent className="flex flex-col sm:flex-row gap-4 text-sm p-4 items-center">
                      {report.photoDataUri ? (
                        <div className="relative aspect-square w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={report.photoDataUri} alt={report.personName || 'Missing person'} layout="fill" objectFit="cover" />
                        </div>
                      ) : (
                         <Avatar className="h-24 w-24 text-3xl">
                           <AvatarFallback className="bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200">
                             {report.personName?.charAt(0) || 'R'}
                           </AvatarFallback>
                         </Avatar>
                      )}
                      <div className='grid gap-1 flex-grow'>
                        <p className="font-bold text-lg">{report.personName}</p>
                        <p className="text-muted-foreground">
                            <span className="font-semibold">Last Seen:</span> {report.lastSeen}
                        </p>
                        <p className="text-muted-foreground">
                            <span className="font-semibold">Reported by:</span> {report.submittedBy} • {report.submittedAt ? formatTimestamp(report.submittedAt) : 'a few moments ago'}
                        </p>
                        <div className="mt-2">
                          <Badge variant="secondary" className='bg-gray-200 dark:bg-gray-700'>Black hoodie</Badge>
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
              <CarouselPrevious className="left-[-1rem]" />
              <CarouselNext className="right-[-1rem]" />
            </>
          )}
        </Carousel>
      </CardContent>
    </Card>
  );
}

function Notifications({ user }: { user: UserProfile | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const markAsRead = async (id: string) => {
    const notifRef = doc(db, "notifications", id);
    try {
        await updateDoc(notifRef, { read: true });
        toast({ title: "Notification marked as read." });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        toast({ title: "Error", description: "Could not update notification.", variant: "destructive" });
    }
  };

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

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><BellRing /> Notifications</h2>
      {notifications.map((notif) => (
        <Alert key={notif.id} variant="default" className="border-accent rounded-2xl">
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

const handleGrievanceSubmit = async (
    type: Grievance['type'],
    details: Record<string, any>,
    user: UserProfile | null,
    setLoading: (loading: boolean) => void,
    toast: (options: any) => void,
    resetForms: () => void
) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to submit a grievance.", variant: "destructive" });
        return;
    }
    setLoading(true);

    const lastSeen = details.lastSeenLocation ? `${details.lastSeenLocation} at ${details.lastSeenHour}:${details.lastSeenMinute}` : undefined;

    try {
        await createGrievance({
            type,
            submittedBy: user.email,
            email: user.email,
            ...details,
            lastSeen,
            photoFile: details.photo,
        });

        toast({
            title: "Grievance Submitted",
            description: `Your report for "${type}" has been received.`,
        });
        resetForms();
    } catch (error) {
        console.error("Error submitting grievance:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        toast({ title: "Error", description: `Failed to submit grievance: ${errorMessage}`, variant: "destructive" });
    } finally {
        setLoading(false);
    }
};

function MedicalAttentionForm({ user, locations, loading, handleSubmit, resetForms }: { user: UserProfile | null, locations: Location[], loading: boolean, handleSubmit: Function, resetForms: () => void }) {
    const [medicalDetails, setMedicalDetails] = useState('');
    const [medicalLocation, setMedicalLocation] = useState('');

    const onReset = () => {
        setMedicalDetails('');
        setMedicalLocation('');
    }

    useEffect(onReset, [resetForms]);

    return (
        <div>
            <CardHeader className="px-1 pt-4">
                <CardTitle>Medical Attention</CardTitle>
                <CardDescription>Report a medical emergency.</CardDescription>
            </CardHeader>
            <CardContent className="px-1">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit('Medical Attention', { details: medicalDetails, location: medicalLocation }, user);
                }} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="medical-location">Your Location</Label>
                        <Select value={medicalLocation} onValueChange={setMedicalLocation} required>
                            <SelectTrigger id="medical-location">
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => <SelectItem key={loc.area} value={loc.name}>{loc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="medical-details">Details of Emergency</Label>
                        <Textarea id="medical-details" placeholder="Describe the situation" value={medicalDetails} onChange={(e) => setMedicalDetails(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">Submit Medical Report</Button>
                </form>
            </CardContent>
        </div>
    );
}

function MissingPersonForm({ user, locations, loading, handleSubmit, resetForms }: { user: UserProfile | null, locations: Location[], loading: boolean, handleSubmit: Function, resetForms: () => void }) {
    const [personName, setPersonName] = useState('');
    const [lastSeenLocation, setLastSeenLocation] = useState('');
    const [lastSeenHour, setLastSeenHour] = useState('');
    const [lastSeenMinute, setLastSeenMinute] = useState('');
    const [missingDetails, setMissingDetails] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onReset = () => {
        setPersonName('');
        setLastSeenLocation('');
        setLastSeenHour('');
        setLastSeenMinute('');
        setMissingDetails('');
        setPhoto(null);
        setPhotoPreview(null);
    }

     useEffect(onReset, [resetForms]);
    
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <CardHeader className="px-1 pt-4">
                <CardTitle>Missing Person</CardTitle>
                <CardDescription>Report a missing person.</CardDescription>
            </CardHeader>
            <CardContent className="px-1">
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit('Missing Person', {
                        personName,
                        lastSeenLocation,
                        lastSeenHour,
                        lastSeenMinute,
                        details: missingDetails,
                        photo
                    }, user);
                }} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="person-name">Missing Person's Name</Label>
                        <Input id="person-name" value={personName} onChange={e => setPersonName(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label>Last Seen</Label>
                        <Select value={lastSeenLocation} onValueChange={setLastSeenLocation} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => <SelectItem key={loc.area} value={loc.name}>{loc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                            <Select value={lastSeenHour} onValueChange={setLastSeenHour} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={lastSeenMinute} onValueChange={setLastSeenMinute} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Minute" />
                                </SelectTrigger>
                                <SelectContent>
                                    {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="missing-details">Description (clothing, etc.)</Label>
                        <Textarea id="missing-details" value={missingDetails} onChange={e => setMissingDetails(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label>Photo (Optional)</Label>
                        {photoPreview && (
                            <div className="relative w-24 h-24">
                                <Image src={photoPreview} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" />
                                <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setPhoto(null); setPhotoPreview(null); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            {photo ? "Change Photo" : "Upload Photo"}
                        </Button>
                        <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">Submit Missing Person Report</Button>
                </form>
            </CardContent>
        </div>
    );
}

interface ChatMessage {
    id: string;
    role: 'user' | 'bot';
    text: string;
}

function Chatbot({ handleNavigation }: { handleNavigation: (path: string, tab?: string) => void }) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        // Initial bot message
        setMessages([{ id: nanoid(), role: 'bot', text: "How can I help you today?" }]);
    }, []);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = { id: nanoid(), role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const result = await crowdManagementChatbot({ query: input });
            const botMessage: ChatMessage = { id: nanoid(), role: 'bot', text: result.response };
            setMessages(prev => [...prev, botMessage]);

            // Handle navigation actions
            if (result.action) {
                switch (result.action) {
                    case 'NAVIGATE_TO_EMERGENCY_FORM':
                        handleNavigation('user/dashboard', 'medical');
                        break;
                    case 'NAVIGATE_TO_MISSING_PERSON_FORM':
                        handleNavigation('user/dashboard', 'missing');
                        break;
                    case 'NAVIGATE_TO_MAP':
                        handleNavigation('/map-view');
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
                <CardDescription>Ask for help or directions.</CardDescription>
            </CardHeader>
            <CardContent className="px-1">
                <div className="h-[400px] flex flex-col">
                    <div className="flex-grow space-y-4 overflow-y-auto p-4 border rounded-md bg-muted/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                {msg.role === 'bot' && <Avatar className="w-8 h-8"><AvatarFallback><Bot /></AvatarFallback></Avatar>}
                                <div className={cn("max-w-xs rounded-lg px-4 py-2 whitespace-pre-wrap", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background')}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleChatSubmit} className="flex items-center gap-2 pt-4">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={loading}
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? <Skeleton className="h-5 w-5 rounded-full animate-spin" /> : <Send />}
                        </Button>
                    </form>
                </div>
            </CardContent>
        </div>
    );
}


export default function UserDashboardPage() {
  const [missingPersonReports, setMissingPersonReports] = useState<Grievance[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();
  const [formResetCounter, setFormResetCounter] = useState(0);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("chatbot");


  const resetAllForms = () => {
    setFormResetCounter(prev => prev + 1);
  };

  const handleNavigation = (path: string, tab?: string) => {
    if (path.startsWith('/')) {
        router.push(path);
    } else {
        if (tab) {
            setActiveTab(tab);
        }
    }
  };


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

    const fetchLocations = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/feeds');
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            const data = await response.json();
            if (data.feeds) {
                const feedLocations = Object.values(data.feeds).map((feed: any) => ({
                    name: feed.name,
                    area: feed.area
                }));
                setLocations(feedLocations);
            }
        } catch (error) {
            console.error("Failed to fetch locations:", error);
            toast({ 
                title: "Could Not Load Locations", 
                description: error instanceof Error ? error.message : "The grievance forms may not work as expected. Please ensure the backend service is running.",
                variant: "destructive" 
            });
        }
    };
    fetchLocations();

    return () => unsubscribeGrievances();
  }, [toast]);

  if (loadingUser) {
      return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      )
  }

  if (!user) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Please Log In</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You must be logged in to view this page and report issues.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
        <Notifications user={user} />
        <MissingPersonsCarousel reports={missingPersonReports} />

        <Card className="rounded-3xl shadow-lg">
            <CardHeader>
                <CardTitle>Report an Issue</CardTitle>
                <CardDescription>
                    Use the tabs below to report a medical emergency, a missing person, or to chat with our assistant.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-full h-auto">
                        <TabsTrigger value="medical" className="flex items-center gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 py-2">
                            <Stethoscope className="h-4 w-4 text-red-500" /> Medical
                        </TabsTrigger>
                        <TabsTrigger value="missing" className="flex items-center gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 py-2">
                            <Search className="h-4 w-4 text-blue-500" /> Missing Person
                        </TabsTrigger>
                         <TabsTrigger value="chatbot" className="flex items-center gap-2 rounded-full data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-800 py-2">
                            <Bot className="h-4 w-4 text-purple-500" /> Assistant
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="medical">
                       <MedicalAttentionForm 
                            user={user} 
                            locations={locations} 
                            loading={formLoading}
                            handleSubmit={(type: any, details: any, user: any) => handleGrievanceSubmit(type, details, user, setFormLoading, toast, resetAllForms)}
                            resetForms={formResetCounter > 0}
                        />
                    </TabsContent>
                    <TabsContent value="missing">
                        <MissingPersonForm 
                            user={user} 
                            locations={locations} 
                            loading={formLoading}
                            handleSubmit={(type: any, details: any, user: any) => handleGrievanceSubmit(type, details, user, setFormLoading, toast, resetAllForms)}
                            resetForms={formResetCounter > 0}
                        />
                    </TabsContent>
                    <TabsContent value="chatbot">
                         <Chatbot handleNavigation={handleNavigation} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  );
}
