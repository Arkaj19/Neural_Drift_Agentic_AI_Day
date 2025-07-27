'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type UserProfile } from "@/hooks/use-user-profile";
import { type Location } from "@/app/user/dashboard/page";
import { ImageIcon, X } from 'lucide-react';

export interface MissingPersonFormData {
    personName: string;
    lastSeenLocation: string;
    lastSeenHour: string;
    lastSeenMinute: string;
    details: string;
    photoDataUri: string | null;
}

interface MissingPersonFormProps {
    user: UserProfile | null;
    locations: Location[];
    loading: boolean;
    handleSubmit: Function;
    resetCounter: number;
}

export default function MissingPersonForm({ user, locations, loading, handleSubmit, resetCounter }: MissingPersonFormProps) {
    const [personName, setPersonName] = useState('');
    const [lastSeenLocation, setLastSeenLocation] = useState('');
    const [lastSeenHour, setLastSeenHour] = useState('');
    const [lastSeenMinute, setLastSeenMinute] = useState('');
    const [details, setDetails] = useState('');
    const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const onReset = () => {
        setPersonName('');
        setLastSeenLocation('');
        setLastSeenHour('');
        setLastSeenMinute('');
        setDetails('');
        setPhotoDataUri(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    useEffect(() => {
        onReset();
    }, [resetCounter]);
    
    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoDataUri(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div>
            <CardHeader className="px-1 pt-4">
                <CardTitle>Missing Person</CardTitle>
                <CardDescription>Report a missing person. Please provide as much detail as possible.</CardDescription>
            </CardHeader>
            <CardContent className="px-1">
                 <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit('Missing Person', {
                        personName,
                        lastSeenLocation,
                        lastSeenHour,
                        lastSeenMinute,
                        details,
                        photoDataUri
                    }, user);
                }} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="person-name">Missing Person's Name</Label>
                        <Input id="person-name" value={personName} onChange={e => setPersonName(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label>Last Seen Location</Label>
                        <Select value={lastSeenLocation} onValueChange={setLastSeenLocation} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => <SelectItem key={loc.area} value={loc.name}>{loc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Last Seen Time</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Select value={lastSeenHour} onValueChange={setLastSeenHour} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                                <SelectContent>
                                    {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={lastSeenMinute} onValueChange={setLastSeenMinute} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Minute" />
                                </SelectTrigger>
                                <SelectContent>
                                    {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="missing-details">Description (clothing, etc.)</Label>
                        <Textarea id="missing-details" value={details} onChange={e => setDetails(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label>Photo (Optional)</Label>
                        {photoDataUri && (
                            <div className="relative w-24 h-24">
                                <Image src={photoDataUri} alt="Preview" layout="fill" objectFit="cover" className="rounded-md" />
                                <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setPhotoDataUri(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            {photoDataUri ? "Change Photo" : "Upload Photo"}
                        </Button>
                        <Input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">Submit Missing Person Report</Button>
                </form>
            </CardContent>
        </div>
    );
}
