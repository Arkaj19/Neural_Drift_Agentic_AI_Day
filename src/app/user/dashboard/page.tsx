
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
import { User, Search, Stethoscope, MessageSquareWarning, AlertTriangle, Mail, Phone, UserCircle, Image as ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, getDocs, limit, getDocsFromCache } from 'firebase/firestore';
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


export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    phone: string;
}

interface GrievanceFormProps {
  type: 'Medical Attention' | 'Missing Person' | 'General Grievance';
  onSuccess: () => void;
  user: UserProfile | null;
}

function GrievanceForm({ type, onSuccess, user }: GrievanceFormProps) {
  const [details, setDetails] = useState('');
  const [personName, setPersonName] = useState('');
  const [lastSeen, setLastSeen] = useState('');
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const clearPhoto = () => {
    setPhotoDataUri(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user || !user.fullName) {
        toast({
            title: "Submission Failed",
            description: "Could not identify the user. Please make sure you are logged in.",
            variant: "destructive",
        });
        setLoading(false);
        return;
    }

    try {
      let grievanceData: any = {
        type,
        details,
        status: 'new',
        submittedAt: serverTimestamp(),
        submittedBy: user.fullName,
      };

      if (type === 'Missing Person') {
        grievanceData = {
          ...grievanceData,
          personName,
          lastSeen,
          photoDataUri,
        };
      }

      await addDoc(collection(db, 'grievances'), grievanceData);

      toast({
        title: "Report Submitted",
        description: `Your report for "${type}" has been successfully submitted.`,
      });
      onSuccess(); // Clear the form
      setDetails('');
      setPersonName('');
      setLastSeen('');
      clearPhoto();

    } catch (error) {
      console.error('Error submitting grievance:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === 'Missing Person' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="personName">Person's Full Name</Label>
            <Input id="personName" value={personName} onChange={(e) => setPersonName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastSeen">Last Seen (Location & Time)</Label>
            <Input id="lastSeen" value={lastSeen} onChange={(e) => setLastSeen(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="photo">Photo</Label>
            <Input id="photo" type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" />
            {photoDataUri && (
                <div className="mt-2 relative h-32 w-32">
                    <Image src={photoDataUri} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" />
                     <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={clearPhoto}>
                        <X className="h-4 w-4" />
                     </Button>
                </div>
            )}
          </div>
        </>
      )}
      <div className="space-y-2">
        <Label htmlFor="details">
          {type === 'Missing Person' ? 'Additional Details (Description, Clothing, etc.)' : 'Please describe the situation'}
        </Label>
        <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading || !user} className="w-full">
        {loading ? 'Submitting...' : 'Submit Report'}
      </Button>
    </form>
  );
}

function MissingPersonsCarousel({ reports }: { reports: Grievance[] }) {
  if (reports.length === 0) return null;

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
            loop: true,
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
                    <CardContent className="flex flex-row gap-4 text-sm">
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
          <CarouselPrevious />
          <CarouselNext />
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

export default function UserDashboardPage() {
  const [formKey, setFormKey] = useState(0); 
  const [missingPersonReports, setMissingPersonReports] = useState<Grievance[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // This effect runs only on the client-side
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
        setLoadingUser(false); // No user is logged in
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
        <MissingPersonsCarousel reports={missingPersonReports} />

        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <p className="text-muted-foreground">Report issues and request assistance.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Stethoscope /> Medical Attention
                    </CardTitle>
                    <CardDescription>Request immediate medical assistance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GrievanceForm key={`medical-${formKey}`} type="Medical Attention" onSuccess={() => setFormKey(k => k + 1)} user={user} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search /> Missing Person
                    </CardTitle>
                    <CardDescription>Report a person who is missing.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GrievanceForm key={`missing-${formKey}`} type="Missing Person" onSuccess={() => setFormKey(k => k + 1)} user={user} />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquareWarning /> General Grievance
                    </CardTitle>
                    <CardDescription>Report any other issues (e.g., lost item, safety concern).</CardDescription>
                </CardHeader>
                <CardContent>
                    <GrievanceForm key={`general-${formKey}`} type="General Grievance" onSuccess={() => setFormKey(k => k + 1)} user={user} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
