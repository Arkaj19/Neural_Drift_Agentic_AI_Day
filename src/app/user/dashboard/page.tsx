
'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Bell, BellRing, X, Stethoscope, Search, Bot, MapIcon } from "lucide-react";
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
import { createGrievance } from '@/services/grievance-service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfile } from '@/hooks/use-user-profile';
import MedicalAttentionForm from '@/components/user-dashboard/medical-form';
import MissingPersonForm from '@/components/user-dashboard/missing-person-form';
import Chatbot from '@/components/user-dashboard/chatbot';
import { useRouter } from 'next/navigation';
import MapViewPage from '@/app/(app)/map-view/page';

export interface Location {
    name: string;
    area: string;
}

interface Notification {
  id: string;
  message: string;
  createdAt: {
    seconds: number;
  };
  read: boolean;
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
    
    // Handle cases where time might not be provided for Missing Person
    const lastSeen = (details.lastSeenLocation && details.lastSeenHour && details.lastSeenMinute) 
        ? `${details.lastSeenLocation} at ${details.lastSeenHour}:${details.lastSeenMinute}` 
        : details.lastSeenLocation;

    try {
        await createGrievance({
            type,
            submittedBy: user.email,
            email: user.email,
            details: details.details,
            location: details.location,
            personName: details.personName,
            photoDataUri: details.photoDataUri,
            lastSeen,
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
  const [showMapView, setShowMapView] = useState(false);

  const resetAllForms = () => {
    setFormResetCounter(prev => prev + 1);
  };

  const handleNavigation = (action: string, tab?: string) => {
    if (action === 'SHOW_USER_MAP') {
        setShowMapView(true);
    } else if (action.startsWith('/')) {
        router.push(action);
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
            const response = await fetch ('http://127.0.0.1:5000/api/feeds');
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

  if (showMapView) {
      return (
          <Card className="rounded-3xl shadow-lg">
              <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><MapIcon /> Venue Map</CardTitle>
                    <Button variant="outline" onClick={() => setShowMapView(false)}>Close Map</Button>
                  </div>
              </CardHeader>
              <CardContent>
                  <MapViewPage />
              </CardContent>
          </Card>
      )
  }

  return (
    <div className="space-y-6">
        <Notifications user={user} />
        <MissingPersonsCarousel reports={missingPersonReports} />

        <Card className="rounded-3xl shadow-lg">
            <CardHeader>
                <CardTitle>Report an Issue</CardTitle>
                <CardDescription>
                    Use the tabs below to report a medical emergency or a missing person, or to chat with our assistant.
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
                            resetCounter={formResetCounter}
                        />
                    </TabsContent>
                    <TabsContent value="missing">
                        <MissingPersonForm 
                            user={user} 
                            locations={locations} 
                            loading={formLoading}
                            handleSubmit={(type: any, details: any, user: any) => handleGrievanceSubmit(type, details, user, setFormLoading, toast, resetAllForms)}
                            resetCounter={formResetCounter}
                        />
                    </TabsContent>
                    <TabsContent value="chatbot">
                         <Chatbot 
                            handleNavigation={handleNavigation} 
                         />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  );
}
