'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Search, Stethoscope, MessageSquareWarning, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import type { Grievance } from '@/app/(app)/grievances/page';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface GrievanceFormProps {
  type: 'Medical Attention' | 'Missing Person' | 'General Grievance';
  onSuccess: () => void;
}

function GrievanceForm({ type, onSuccess }: GrievanceFormProps) {
  const [details, setDetails] = useState('');
  const [personName, setPersonName] = useState('');
  const [lastSeen, setLastSeen] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let grievanceData: any = {
        type,
        details,
        status: 'new',
        submittedAt: serverTimestamp(),
        // In a real app with auth, you'd get the user's email from their session
        submittedBy: 'testuser@example.com',
      };

      if (type === 'Missing Person') {
        grievanceData = {
          ...grievanceData,
          personName,
          lastSeen,
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
        </>
      )}
      <div className="space-y-2">
        <Label htmlFor="details">
          {type === 'Missing Person' ? 'Additional Details (Description, Clothing, etc.)' : 'Please describe the situation'}
        </Label>
        <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
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
                            Reported by {report.submittedBy} • {formatTimestamp(report.submittedAt)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                      <div>
                        <p className="font-semibold">Last Seen</p>
                        <p className="text-muted-foreground">{report.lastSeen}</p>
                      </div>
                       <div>
                        <p className="font-semibold">Details</p>
                        <p className="text-muted-foreground">{report.details}</p>
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


export default function UserDashboardPage() {
  const [formKey, setFormKey] = useState(0); // Used to reset form state
  const [missingPersonReports, setMissingPersonReports] = useState<Grievance[]>([]);

  useEffect(() => {
    const q = query(collection(db, "grievances"), where("type", "==", "Missing Person"), where("status", "==", "new"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grievance));
      setMissingPersonReports(reports);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
        <MissingPersonsCarousel reports={missingPersonReports} />

        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <p className="text-muted-foreground">Report issues and request assistance.</p>
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Stethoscope /> Medical Attention
                    </CardTitle>
                    <CardDescription>Request immediate medical assistance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GrievanceForm key={`medical-${formKey}`} type="Medical Attention" onSuccess={() => setFormKey(k => k + 1)} />
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
                    <GrievanceForm key={`missing-${formKey}`} type="Missing Person" onSuccess={() => setFormK(k => k + 1)} />
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
                    <GrievanceForm key={`general-${formKey}`} type="General Grievance" onSuccess={() => setFormKey(k => k + 1)} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User /> My Profile
                    </CardTitle>
                    <CardDescription>View and manage your profile information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">This section is under construction. Future updates will allow you to view your submitted reports and manage your account.</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
