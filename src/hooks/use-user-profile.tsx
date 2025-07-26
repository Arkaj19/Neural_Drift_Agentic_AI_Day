
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    phone: string;
}

interface UserProfileContextType {
    user: UserProfile | null;
    loading: boolean;
}

const UserProfileContext = createContext<UserProfileContextType>({
    user: null,
    loading: true,
});

export const useUserProfile = () => useContext(UserProfileContext);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const loggedInUserEmail = localStorage.getItem('userEmail');
            if (!loggedInUserEmail) {
                setLoading(false);
                return;
            }

            try {
                const q = query(collection(db, "users"), where("email", "==", loggedInUserEmail), limit(1));
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
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return (
        <UserProfileContext.Provider value={{ user, loading }}>
            {children}
        </UserProfileContext.Provider>
    );
};
