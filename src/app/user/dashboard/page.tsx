import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Search, Stethoscope, MessageSquareWarning } from "lucide-react";

export default function UserDashboardPage() {
  return (
    <div className="space-y-4">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User /> User Info
                    </CardTitle>
                    <CardDescription>View and manage your profile.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Details about the user...</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search /> Missing Person
                    </CardTitle>
                    <CardDescription>Report a missing person.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p>Form to report a missing person...</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Stethoscope /> Medical Attention
                    </CardTitle>
                    <CardDescription>Request medical assistance.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p>Form to request medical help...</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquareWarning /> General Grievance
                    </CardTitle>
                    <CardDescription>Report any other issues.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Form for general grievances...</p>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
