'use client';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { keyMetrics, type Guard } from "@/lib/data";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  Users,
  ShieldAlert,
  Signal,
  Phone,
  User,
} from "lucide-react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { useEffect, useState } from "react";

const metricIcons: { [key: string]: React.ElementType } = {
    "Total Crowd": Users,
    "Active Guards": ShieldAlert,
    "Active Alerts": Signal,
    "System Status": Signal,
};


const getStatusBadgeVariant = (status: "Active" | "Alert" | "Standby") => {
  switch (status) {
    case "Active":
      return "default";
    case "Alert":
      return "destructive";
    case "Standby":
      return "secondary";
    default:
      return "outline";
  }
};

export default function DashboardPage() {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [metrics, setMetrics] = useState(keyMetrics);

  useEffect(() => {
    // Fetch guards data
    const guardsUnsubscribe = onSnapshot(collection(db, "guards"), (snapshot) => {
      const guardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guard));
      setGuards(guardsData);
      
      // Update active guards count in metrics
      setMetrics(prevMetrics => {
        const activeGuardsCount = guardsData.filter(g => g.status === 'Active').length;
        const currentActiveGuards = parseInt(prevMetrics["Active Guards"].value) || 0;
        const changeType = activeGuardsCount > currentActiveGuards ? 'increase' : activeGuardsCount < currentActiveGuards ? 'decrease' : 'neutral';
        return {
          ...prevMetrics,
          "Active Guards": {
              ...prevMetrics["Active Guards"],
              value: activeGuardsCount.toString(),
              change: `${changeType === 'increase' ? '+' : ''}${activeGuardsCount - currentActiveGuards}`,
              changeType: changeType
          }
        }
      });
    });

    // Fetch total crowd data
    const crowdDocRef = doc(db, "crowdData", "total");
    const crowdUnsubscribe = onSnapshot(crowdDocRef, (doc) => {
        if (doc.exists()) {
            const crowdData = doc.data();
            setMetrics(prevMetrics => {
              const currentCrowd = parseInt(prevMetrics["Total Crowd"].value.replace(/,/g, '')) || 0;
              const newCrowd = crowdData.count;
              const changeType = newCrowd > currentCrowd ? 'increase' : newCrowd < currentCrowd ? 'decrease' : 'neutral';

              return {
                  ...prevMetrics,
                  "Total Crowd": {
                      ...prevMetrics["Total Crowd"],
                      value: newCrowd.toLocaleString(),
                      change: `${newCrowd - currentCrowd >= 0 ? '+' : ''}${(newCrowd - currentCrowd).toLocaleString()}`,
                      changeType: changeType
                  }
              }
            });
        }
    });

    return () => {
      guardsUnsubscribe();
      crowdUnsubscribe();
    };
  }, []);


  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(metrics).map(([title, data]) => {
          const Icon = metricIcons[title];
          if (!Icon) {
            return null; // Or a placeholder/error component
          }
          return (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.value}</div>
                <p
                  className={cn(
                    "text-xs text-muted-foreground flex items-center",
                    {
                      "text-green-400": data.changeType === "increase",
                      "text-red-400": data.changeType === "decrease" || (title === "Active Alerts" && data.changeType === "increase"),
                    }
                  )}
                >
                  {data.changeType === "increase" ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : data.changeType === "decrease" ? (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  ) : null}
                  {data.change} from last hour
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Guard Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guard</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guards.map((guard) => (
                <TableRow key={guard.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>
                            <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{guard.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{guard.sector}</TableCell>
                  <TableCell>{guard.location}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(guard.status)}>
                      {guard.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
