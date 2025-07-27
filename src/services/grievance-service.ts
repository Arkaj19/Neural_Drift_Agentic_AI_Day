'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface GrievanceData {
    type: 'Medical Attention' | 'Missing Person' | 'General Grievance';
    details: string;
    submittedBy: string;
    email: string;
    location?: string;
    personName?: string;
    lastSeen?: string;
    photoDataUri?: string;
}

// This is the type that will be stored in Firestore.
interface GrievancePayload extends GrievanceData {
    status: 'new' | 'resolved';
    submittedAt: any;
}


export const createGrievance = async (data: GrievanceData) => {
    // Manually construct the payload to ensure no File object is included.
    const grievancePayload: Partial<GrievancePayload> = {
        type: data.type,
        details: data.details,
        submittedBy: data.submittedBy,
        email: data.email,
        status: 'new',
        submittedAt: serverTimestamp(),
    };
    
    if (data.location) grievancePayload.location = data.location;
    if (data.personName) grievancePayload.personName = data.personName;
    if (data.lastSeen) grievancePayload.lastSeen = data.lastSeen;
    if (data.photoDataUri) grievancePayload.photoDataUri = data.photoDataUri;

    try {
        const docRef = await addDoc(collection(db, 'grievances'), grievancePayload);
        console.log('Grievance created with ID:', docRef.id);
        return { success: true, grievanceId: docRef.id };
    } catch (error) {
        console.error('Error creating grievance:', error);
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};
