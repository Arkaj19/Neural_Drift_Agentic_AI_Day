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

export const createGrievance = async (data: GrievanceData) => {
    // Create a mutable copy of the data to be sent to Firestore
    const grievancePayload: Omit<GrievanceData, 'photoFile'> & { photoDataUri?: string | null, submittedAt?: any, status?: string } = { ...data };
    
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
    
    // Explicitly remove the original File object from the payload
    // to avoid a Firestore serialization error.
    delete (grievancePayload as Partial<GrievanceData>).photoFile;
    
    // Add Firestore-specific fields
    grievancePayload.status = 'new';
    grievancePayload.submittedAt = serverTimestamp();

    try {
        const docRef = await addDoc(collection(db, 'grievances'), grievancePayload);
        console.log('Grievance created with ID:', docRef.id);
        return { success: true, grievanceId: docRef.id };
    } catch (error) {
        console.error('Error creating grievance:', error);
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};
