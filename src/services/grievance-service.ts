
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
    let photoDataUri = null;

    if (data.photoFile) {
        try {
            // Convert file to buffer and then to data URL on the server
            const fileBuffer = await data.photoFile.arrayBuffer();
            const base64 = Buffer.from(fileBuffer).toString('base64');
            photoDataUri = `data:${data.photoFile.type};base64,${base64}`;

        } catch (error) {
            console.error("Error processing photo:", error);
            // Decide if you want to proceed without the photo or throw an error
            throw new Error("Failed to process photo.");
        }
    }
    
    // Destructure to remove photoFile and keep the rest of the payload
    const { photoFile, ...grievancePayload } = data;

    try {
        const docRef = await addDoc(collection(db, 'grievances'), {
            ...grievancePayload,
            photoDataUri: photoDataUri, // Save the data URI or null
            status: 'new',
            submittedAt: serverTimestamp(),
        });
        console.log('Grievance created with ID:', docRef.id);
        return { success: true, grievanceId: docRef.id };
    } catch (error) {
        console.error('Error creating grievance:', error);
        throw new Error(error instanceof Error ? error.message : "An unknown error occurred");
    }
};
