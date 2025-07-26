
'use client';
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, User, Search, Stethoscope, MessageSquareWarning, RefreshCw, AlertTriangle, Image as ImageIcon } from "lucide-react";
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
  submittedBy?: string; // name of the user
  personName?: string; // For missing person
  lastSeen?: string; // For missing person
  photoDataUri?: string; // For missing person image
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
  const { toast } = useToast();

  useEffect(() => {
    const grievancesRef = collection(db, "grievances");
    const unsubscribe = onSnapshot(grievancesRef, (snapshot) => {
      const grievancesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Grievance))
        .filter(g => g.status === 'new') // Only show new grievances
        .sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
      setGrievances(grievancesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleResolve = async (id: string) => {
    const grievanceRef = doc(db, "grievances", id);
    try {
      await updateDoc(grievanceRef, { status: 'resolved' });
      toast({
        title: "Grievance Resolved",
        description: "The grievance has been marked as resolved and removed from the list.",
      });
    } catch (error) {
      console.error("Error resolving grievance:", error);
      toast({
        title: "Error",
        description: "Could not resolve the grievance. Please try again.",
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
                        <DropdownMenuItem onClick={() => handleResolve(grievance.id)}>
                          Acknowledge & Resolve
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardTitle>
                  <CardDescription>
                    Submitted {formatTimestamp(grievance.submittedAt)} by {grievance.submittedBy || 'Anonymous'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {grievance.photoDataUri && (
                    <div className="relative aspect-video w-full mb-4 rounded-md overflow-hidden">
                       <Image src={grievance.photoDataUri} alt={grievance.personName || 'Missing person'} layout="fill" objectFit="cover" />
                    </div>
                   )}
                  {grievance.type === 'Missing Person' && (
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {grievance.personName}</p>
                      <p><strong>Last Seen:</strong> {grievance.lastSeen}</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">{grievance.details}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  );
}
