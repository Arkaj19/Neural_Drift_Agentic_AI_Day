
'use client';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { keyMetrics, type Guard, sectors as sectorOptions } from "@/lib/data";
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
  PlusCircle,
  Stethoscope,
  Search,
  MessageSquareWarning,
  AlertOctagon,
  FileText,
  RefreshCw
} from "lucide-react";
import { collection, onSnapshot, doc, addDoc, updateDoc, query, where } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Grievance } from "@/app/(app)/grievances/page";
import { summarizeDashboard } from "@/ai/flows/summarize-dashboard";


const metricIcons: { [key: string]: React.ElementType } = {
    "Active Guards": ShieldAlert,
    "Active Alerts": Signal,
    "Open Grievances": AlertOctagon,
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

function AddGuardForm({ onGuardAdded }: { onGuardAdded: () => void }) {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState<Guard["status"]>("Standby");
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    try {
      await addDoc(collection(db, "guards"), {
        name,
        sector,
        status,
        phone,
      });
      toast({
        title: "Guard Added",
        description: `${name} has been added to the roster.`,
      });
      onGuardAdded(); // Close dialog
      // Reset form
      setName("");
      setSector("");
      setStatus("Standby");
      setPhone("");
    } catch (error: any) {
      console.error("Error adding guard: ", error);
      toast({
        title: "Error adding guard",
        description: error.message || "Could not add guard. Please check console and Firebase rules.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Guard Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="123-456-7890" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sector">Sector</Label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger id="sector">
              <SelectValue placeholder="Select a sector" />
            </SelectTrigger>
            <SelectContent>
              {sectorOptions.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Guard['status'])}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Standby">Standby</SelectItem>
              <SelectItem value="Alert">Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit">Add Guard</Button>
      </DialogFooter>
    </form>
  );
}

export default function DashboardPage() {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [metrics, setMetrics] = useState(keyMetrics);
  const [isAddGuardOpen, setAddGuardOpen] = useState(false);
  const { toast } = useToast();
  const [openGrievances, setOpenGrievances] = useState<Grievance[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);

  const alertsIntervalRef = useRef<NodeJS.Timeout>();

  const grievanceCounts = openGrievances.reduce((acc, g) => {
      acc.total++;
      if (g.type === 'Medical Attention') acc.medical++;
      else if (g.type === 'Missing Person') acc.missing++;
      else if (g.type === 'General Grievance') acc.general++;
      return acc;
  }, { total: 0, medical: 0, missing: 0, general: 0 });

  useEffect(() => {
    // Fetch guards data
    const guardsUnsubscribe = onSnapshot(collection(db, "guards"), (snapshot) => {
      const guardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guard));
      setGuards(guardsData);
      
      setMetrics(prevMetrics => {
        const activeGuardsCount = guardsData.filter(g => g.status === 'Active').length;
        const currentActiveGuardsMetric = prevMetrics["Active Guards"];
        if (!currentActiveGuardsMetric) return prevMetrics;

        const currentActiveGuards = parseInt(currentActiveGuardsMetric.value) || 0;
        const changeType = activeGuardsCount > currentActiveGuards ? 'increase' : activeGuardsCount < currentActiveGuards ? 'decrease' : 'neutral';
        
        return {
          ...prevMetrics,
          "Active Guards": {
              ...currentActiveGuardsMetric,
              value: activeGuardsCount.toString(),
              change: `${changeType === 'increase' ? '+' : ''}${activeGuardsCount - currentActiveGuards}`,
              changeType: changeType
          }
        }
      });
    });

    // Fetch active alerts data
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/alerts');
        if (response.ok) {
          const data = await response.json();
          const activeAlerts = data.alerts.filter(
            (alert: { alert_level: string; }) => alert.alert_level === 'warning' || alert.alert_level === 'critical'
          );
          setAlerts(activeAlerts);

          setMetrics(prevMetrics => {
            const activeAlertsMetric = prevMetrics["Active Alerts"];
            if (!activeAlertsMetric) return prevMetrics;

            const currentAlerts = parseInt(activeAlertsMetric.value) || 0;
            const newCount = activeAlerts.length;
            const changeType = newCount > currentAlerts ? 'increase' : newCount < currentAlerts ? 'decrease' : 'neutral';

            return {
              ...prevMetrics,
              "Active Alerts": {
                ...activeAlertsMetric,
                value: newCount.toString(),
                change: `${changeType === 'increase' ? '+' : ''}${newCount - currentAlerts}`,
                changeType: changeType,
              },
            };
          });
        } else {
            if (alertsIntervalRef.current) {
              clearInterval(alertsIntervalRef.current);
            }
            toast({
                title: "Could not fetch alerts",
                description: `The alerts service responded with status: ${response.status}. Please check the backend.`,
                variant: "destructive"
            });
        }
      } catch (error) {
        console.error("Failed to fetch active alerts:", error);
        if (alertsIntervalRef.current) {
          clearInterval(alertsIntervalRef.current);
        }
        toast({
            title: "Could not fetch alerts",
            description: "The connection to the alerts service failed. Please ensure the backend is running.",
            variant: "destructive"
        })
      }
    };
    
    fetchAlerts();
    alertsIntervalRef.current = setInterval(fetchAlerts, 10000);

    const grievancesQuery = query(collection(db, "grievances"), where("status", "==", "new"));
    const grievancesUnsubscribe = onSnapshot(grievancesQuery, (snapshot) => {
      const grievancesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grievance));
      setOpenGrievances(grievancesData);
    });

    return () => {
      guardsUnsubscribe();
      if(alertsIntervalRef.current) {
        clearInterval(alertsIntervalRef.current);
      }
      grievancesUnsubscribe();
    };
  }, [toast]);
  

  const handleGuardUpdate = async (guardId: string, field: keyof Guard, value: string) => {
    const guardRef = doc(db, "guards", guardId);
    try {
      await updateDoc(guardRef, { [field]: value });
      toast({
        title: "Guard Updated",
        description: `Guard's ${field} has been updated.`,
      });
    } catch (error: any) {
      console.error("Error updating guard: ", error);
      toast({
        title: "Error",
        description: error.message || "Could not update guard. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    try {
      const result = await summarizeDashboard({
        guards,
        alerts,
        grievances: openGrievances
      });
      setSummary(result.summary);
      setIsSummaryDialogOpen(true);
    } catch (error) {
       console.error("Error generating summary:", error);
       toast({
         title: "Error",
         description: "Could not generate the summary. Please try again.",
         variant: "destructive",
       });
    } finally {
        setIsSummaryLoading(false);
    }
  }


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button onClick={handleGenerateSummary} disabled={isSummaryLoading}>
          {isSummaryLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          Generate Summary
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(metrics).map(([title, data]) => {
          const Icon = metricIcons[title];
          if (!Icon) return null;
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
                      "text-green-400": data.changeType === "increase" && title !== "Active Alerts",
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
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Grievances</CardTitle>
                <AlertOctagon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{grievanceCounts.total}</div>
                <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2 mt-2">
                    <div className="flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" />
                        <span>Medical: {grievanceCounts.medical}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Search className="h-3 w-3" />
                        <span>Missing: {grievanceCounts.missing}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageSquareWarning className="h-3 w-3" />
                        <span>General: {grievanceCounts.general}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Guard Status</CardTitle>
                <CardDescription>Manage your security team in real-time.</CardDescription>
            </div>
            <Dialog open={isAddGuardOpen} onOpenChange={setAddGuardOpen}>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Guard
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                <DialogTitle>Add New Guard</DialogTitle>
                <DialogDescription>
                    Enter the details for the new guard. Click save when you're done.
                </DialogDescription>
                </DialogHeader>
                <AddGuardForm onGuardAdded={() => setAddGuardOpen(false)} />
            </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guard</TableHead>
                <TableHead>Sector</TableHead>
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
                  <TableCell>
                    <Select value={guard.sector} onValueChange={(value) => handleGuardUpdate(guard.id, 'sector', value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Sector" />
                        </SelectTrigger>
                        <SelectContent>
                            {sectorOptions.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={guard.status} onValueChange={(value) => handleGuardUpdate(guard.id, 'status', value as Guard['status'])}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue asChild>
                                <Badge variant={getStatusBadgeVariant(guard.status)} className="capitalize">{guard.status}</Badge>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active"><Badge variant="default">Active</Badge></SelectItem>
                            <SelectItem value="Standby"><Badge variant="secondary">Standby</Badge></SelectItem>
                            <SelectItem value="Alert"><Badge variant="destructive">Alert</Badge></SelectItem>
                        </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{guard.phone}</span>
                        <Button variant="outline" size="sm" asChild>
                           <a href={`tel:${guard.phone}`}>
                                <Phone className="h-4 w-4 mr-2" />
                                Contact
                            </a>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>Live Event Summary</DialogTitle>
            <DialogDescription>
                An AI-generated summary of the current event status.
            </DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                {summary}
            </div>
            <DialogFooter>
            <Button onClick={() => setIsSummaryDialogOpen(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

  