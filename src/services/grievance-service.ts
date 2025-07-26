
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
        const reader = new FileReader();
        const fileReadPromise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
        reader.readAsDataURL(data.photoFile);
        
        try {
            const dataUrl = await fileReadPromise;
            const storageRef = ref(storage, `grievance-photos/${Date.now()}-${data.photoFile.name}`);
            const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
            photoDataUri = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Error uploading photo:", error);
            // Decide if you want to proceed without the photo or throw an error
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
