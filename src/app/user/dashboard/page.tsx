
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
import { Mail, Phone, AlertTriangle, Image as ImageIcon, X, Bell, BellRing, Clock } from "lucide-react";
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createGrievance } from '@/services/grievance-service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

function GrievanceForm({ user }: { user: UserProfile | null }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<{name: string, area: string}[]>([]);

    // State for Medical Attention
    const [medicalDetails, setMedicalDetails] = useState('');
    const [medicalLocation, setMedicalLocation] = useState('');

    // State for Missing Person
    const [personName, setPersonName] = useState('');
    const [lastSeenLocation, setLastSeenLocation] = useState('');
    const [lastSeenHour, setLastSeenHour] = useState('');
    const [lastSeenMinute, setLastSeenMinute] = useState('');
    const [missingDetails, setMissingDetails] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for General Grievance
    const [generalDetails, setGeneralDetails] = useState('');

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/feeds');
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
                toast({ title: "Error", description: "Could not load locations for forms.", variant: "destructive" });
            }
        };
        fetchLocations();
    }, [toast]);
    
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

    const handleSubmit = async (
        type: Grievance['type'],
        details: Record<string, any>
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
                photoFile: photo, // Pass the file object directly
            });

            toast({
                title: "Grievance Submitted",
                description: `Your report for "${type}" has been received.`,
            });
            // Reset forms
            setMedicalDetails('');
            setMedicalLocation('');
            setPersonName('');
            setLastSeenLocation('');
            setLastSeenHour('');
            setLastSeenMinute('');
            setMissingDetails('');
            setPhoto(null);
            setPhotoPreview(null);
            setGeneralDetails('');

        } catch (error) {
            console.error("Error submitting grievance:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            toast({ title: "Error", description: `Failed to submit grievance: ${errorMessage}`, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Please Log In</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>You must be logged in to report an issue.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div>
            <CardHeader className="px-0">
                <CardTitle>Report an Issue</CardTitle>
                <CardDescription>
                    Use the forms below to report a medical emergency, a missing person, or a general concern.
                </CardDescription>
            </CardHeader>
            <div className="grid md:grid-cols-3 gap-6">
                {/* Medical Attention */}
                <Card>
                    <CardHeader>
                        <CardTitle>Medical Attention</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit('Medical Attention', { details: medicalDetails, location: medicalLocation });
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
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Time will be recorded automatically.</span>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full">Submit Medical Report</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Missing Person */}
                <Card>
                    <CardHeader>
                        <CardTitle>Missing Person</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <form onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit('Missing Person', {
                                personName,
                                lastSeenLocation,
                                lastSeenHour,
                                lastSeenMinute,
                                details: missingDetails,
                            });
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
                </Card>

                {/* General Grievance */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Grievance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit('General Grievance', { details: generalDetails });
                        }} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="general-details">Describe your concern</Label>
                                <Textarea id="general-details" className="h-52" placeholder="Please provide as much detail as possible." value={generalDetails} onChange={(e) => setGeneralDetails(e.target.value)} required />
                            </div>
                             <Button type="submit" disabled={loading} className="w-full">Submit General Grievance</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
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
        <GrievanceForm user={user} />
    </div>
  );
}
