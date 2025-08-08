
'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, User, Search, Stethoscope, MessageSquareWarning, RefreshCw, AlertTriangle, Image as ImageIcon, MapPin, Ambulance, UserCheck } from "lucide-react";
import Image from "next/image";

export interface Grievance {
  id: string;
  type: 'Medical Attention' | 'Missing Person' | 'General Grievance';
  details: string;
  submittedAt: {
    seconds: number;
    nanoseconds: number;
  };
  status: 'new' | 'resolved';
  submittedBy?: string; 
  email?: string; // User's email to send notifications
  personName?: string; 
  lastSeen?: string; 
  photoDataUri?: string; 
  location?: string; 
  actionTaken?: string;
}

interface AmbulanceData {
    id: string;
    ambulanceNumber: string;
    isAvailable: boolean;
}

interface MedicalStaffData {
    id: string;
    name: string;
    status: string;
}

const grievanceIcons = {
  'Medical Attention': Stethoscope,
  'Missing Person': Search,
  'General Grievance': MessageSquareWarning,
};

const grievanceColors = {
    'Medical Attention': 'border-red-500 bg-red-900/10',
    'Missing Person': 'border-yellow-500 bg-yellow-900/10',
    'General Grievance': 'border-blue-500 bg-blue-900/10',
};

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [medicalStaff, setMedicalStaff] = useState<MedicalStaffData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch Grievances
    const grievancesRef = collection(db, "grievances");
    const grievancesUnsubscribe = onSnapshot(grievancesRef, (snapshot) => {
      const grievancesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Grievance))
        .filter(g => g.status === 'new')
        .sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
      setGrievances(grievancesData);
      setLoading(false);
    });

    // Fetch Ambulances
    const ambulancesRef = collection(db, "ambulances");
    const ambulancesUnsubscribe = onSnapshot(ambulancesRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as AmbulanceData));
        setAmbulances(data);
    });

    // Fetch Medical Staff
    const medicalStaffRef = collection(db, "medical_staff");
    const medicalStaffUnsubscribe = onSnapshot(medicalStaffRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as MedicalStaffData));
        setMedicalStaff(data);
    });

    return () => {
        grievancesUnsubscribe();
        ambulancesUnsubscribe();
        medicalStaffUnsubscribe();
    };
  }, []);

  const handleResolve = async (grievance: Grievance) => {
    const grievanceRef = doc(db, "grievances", grievance.id);
    const notificationsRef = collection(db, "notifications");
    const userEmail = grievance.email || grievance.submittedBy;

    if (!userEmail) {
        toast({ title: "Error", description: "User email is missing from this grievance.", variant: "destructive" });
        return;
    }

    try {
      let message = `Your grievance regarding "${grievance.type}" has been acknowledged and resolved.`;
      if (grievance.type === 'Missing Person') {
          message = `Your report for the missing person "${grievance.personName}" has been acknowledged. Our team is actively looking into it.`;
      }

      await addDoc(notificationsRef, {
        userEmail: userEmail,
        message: message,
        createdAt: serverTimestamp(),
        read: false,
      });

      if (grievance.type === 'Missing Person') {
        await deleteDoc(grievanceRef);
        toast({
          title: "Missing Person Report Resolved",
          description: "The report has been removed from the active list.",
        });
      } else {
         await updateDoc(grievanceRef, { status: 'resolved', actionTaken: 'Acknowledged by Admin' });
         toast({
          title: "Grievance Resolved",
          description: "The grievance has been resolved and the user has been notified.",
        });
      }
      
    } catch (error) {
      console.error("Error resolving grievance:", error);
      toast({
        title: "Error",
        description: "Could not resolve the grievance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMedicalAction = async (grievance: Grievance, action: string) => {
    const userEmail = grievance.email || grievance.submittedBy;
    if (!grievance.id || !userEmail) {
        toast({ title: "Error", description: "Grievance ID or user email is missing.", variant: "destructive" });
        return;
    }

    const grievanceRef = doc(db, "grievances", grievance.id);
    const notificationsRef = collection(db, "notifications");
    
    try {
      await updateDoc(grievanceRef, { 
        status: 'resolved',
        actionTaken: action,
      });

      await addDoc(notificationsRef, {
        userEmail: userEmail,
        message: `Your request for medical attention at ${grievance.location || 'the specified location'} has been addressed. Action taken: ${action}.`,
        createdAt: serverTimestamp(),
        read: false,
      });

      toast({
        title: "Action Taken",
        description: `Action "${action}" has been logged and the user has been notified.`,
      });
    } catch (error) {
      console.error("Error taking medical action:", error);
      toast({
        title: "Error",
        description: "Could not process the action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTimestamp = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };


  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Grievances</h2>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const availableAmbulances = ambulances.filter(a => a.isAvailable);
  const availableStaff = medicalStaff.filter(s => s.status === 'available');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Grievances</h2>
      {grievances.length === 0 ? (
         <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <MessageSquareWarning className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No Open Grievances</h3>
              <p className="text-sm text-muted-foreground">
                All user-submitted grievances have been resolved.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grievances.map((grievance) => {
            const Icon = grievanceIcons[grievance.type];
            return (
              <Card key={grievance.id} className={grievanceColors[grievance.type]}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {grievance.type}
                    </div>
                     <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {grievance.type === 'Medical Attention' ? (
                          <>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger disabled={availableAmbulances.length === 0}>
                                    <Ambulance className="mr-2 h-4 w-4" />
                                    Deploy Ambulance
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuSubContent>
                                        {availableAmbulances.map(amb => (
                                            <DropdownMenuItem key={amb.id} onClick={() => handleMedicalAction(grievance, `Ambulance ${amb.ambulanceNumber} deployed`)}>
                                                {amb.ambulanceNumber}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger disabled={availableStaff.length === 0}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Send Medical Staff
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                     <DropdownMenuSubContent>
                                        {availableStaff.map(staff => (
                                            <DropdownMenuItem key={staff.id} onClick={() => handleMedicalAction(grievance, `Medical staff ${staff.name} sent`)}>
                                                {staff.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => handleResolve(grievance)}>
                            Acknowledge & Resolve
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardTitle>
                  <CardDescription>
                    Submitted {formatTimestamp(grievance.submittedAt)} by {grievance.submittedBy || 'Anonymous'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        {grievance.photoDataUri && (
                            <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                                <Image src={grievance.photoDataUri} alt={grievance.personName || 'Missing person'} layout="fill" objectFit="cover" />
                            </div>
                        )}
                        <div className="flex-grow space-y-2">
                            {grievance.type === 'Missing Person' && (
                                <div className="space-y-2 text-sm">
                                <p><strong>Name:</strong> {grievance.personName}</p>
                                <p><strong>Last Seen:</strong> {grievance.lastSeen}</p>
                                </div>
                            )}
                             {grievance.type === 'Medical Attention' && grievance.location && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4" />
                                    <strong>Location:</strong> {grievance.location}
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground">{grievance.details}</p>
                        </div>
                    </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}