
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

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

const storage = getStorage();

export const createGrievance = async (data: GrievanceData) => {
    let photoDataUri = null;

    if (data.photoFile) {
        try {
            // Convert file to buffer and then to data URL on the server
            const fileBuffer = await data.photoFile.arrayBuffer();
            const base64 = Buffer.from(fileBuffer).toString('base64');
            const dataUrl = `data:${data.photoFile.type};base64,${base64}`;

            const storageRef = ref(storage, `grievance-photos/${Date.now()}-${data.photoFile.name}`);
            const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
            photoDataUri = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Error uploading photo:", error);
            // Decide if you want to proceed without the photo or throw an error
            throw new Error("Failed to upload photo.");
        }
    }
    
    const { photoFile, ...grievancePayload } = data;

    try {
        const docRef = await addDoc(collection(db, 'grievances'), {
            ...grievancePayload,
            photoDataUri: photoDataUri, // Save the download URL or null
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
