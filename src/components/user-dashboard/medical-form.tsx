'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type UserProfile } from "@/hooks/use-user-profile";
import { type Location } from "@/app/user/dashboard/page";

interface MedicalAttentionFormProps {
    user: UserProfile | null;
    locations: Location[];
    loading: boolean;
    handleSubmit: Function;
    resetCounter: number;
}

export default function MedicalAttentionForm({ user, locations, loading, handleSubmit, resetCounter }: MedicalAttentionFormProps) {
    const [medicalDetails, setMedicalDetails] = useState('');
    const [medicalLocation, setMedicalLocation] = useState('');

    const onReset = () => {
        setMedicalDetails('');
        setMedicalLocation('');
    }

    useEffect(onReset, [resetCounter]);

    return (
        <div>
            <CardHeader className="px-1 pt-4">
                <CardTitle>Medical Attention</CardTitle>
                <CardDescription>Report a medical emergency.</CardDescription>
            </CardHeader>
            <CardContent className="px-1">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit('Medical Attention', { details: medicalDetails, location: medicalLocation }, user);
                }} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="medical-location">Your Location</Label>
                        <Select value={medicalLocation} onValueChange={setMedicalLocation} required>
                            <SelectTrigger id="medical-location">
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => <SelectItem key={loc.area} value={loc.name}>{loc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="medical-details">Details of Emergency</Label>
                        <Textarea id="medical-details" placeholder="Describe the situation" value={medicalDetails} onChange={(e) => setMedicalDetails(e.target.value)} required />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">Submit Medical Report</Button>
                </form>
            </CardContent>
        </div>
    );
}
