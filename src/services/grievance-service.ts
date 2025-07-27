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
    photoFile?: File;
}

// This is the type that will be stored in Firestore.
// Notice it does not contain `photoFile`.
interface GrievancePayload {
    type: 'Medical Attention' | 'Missing Person' | 'General Grievance';
    details: string;
    submittedBy: string;
    email: string;
    status: 'new' | 'resolved';
    submittedAt: any;
    location?: string;
    personName?: string;
    lastSeen?: string;
    photoDataUri?: string;
}


export const createGrievance = async (data: GrievanceData) => {
    // Manually construct the payload to ensure no File object is included.
    const grievancePayload: GrievancePayload = {
        type: data.type,
        details: data.details,
        submittedBy: data.submittedBy,
        email: data.email,
        location: data.location,
        personName: data.personName,
        lastSeen: data.lastSeen,
        status: 'new',
        submittedAt: serverTimestamp(),
    };
    
    if (data.photoFile) {
        try {
            // Convert file to buffer and then to data URL on the server
            const fileBuffer = await data.photoFile.arrayBuffer();
            const base64 = Buffer.from(fileBuffer).toString('base64');
            // Add the data URI to the payload
            grievancePayload.photoDataUri = `data:${data.photoFile.type};base64,${base64}`;
        } catch (error) {
            console.error("Error processing photo:", error);
            throw new Error("Failed to process photo.");
        }
    }

    try {
        const docRef = await addDoc(collection(db, 'grievances'), grievancePayload);
        console.log('Grievance created with ID:', docRef.id);
        return { success: true, grievanceId: docRef.id };
    } catch (error) {
        console.error('Error creating grievance:', error);
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};
