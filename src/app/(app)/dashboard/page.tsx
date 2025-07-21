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
} from "lucide-react";
import { collection, onSnapshot, doc, addDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    // Fetch guards data
    const guardsUnsubscribe = onSnapshot(collection(db, "guards"), (snapshot) => {
      const guardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guard));
      setGuards(guardsData);
      
      // Update active guards count in metrics
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

    // Fetch total crowd data
    const crowdDocRef = doc(db, "crowdData", "total");
    const crowdUnsubscribe = onSnapshot(crowdDocRef, (doc) => {
        if (doc.exists()) {
            const crowdData = doc.data();
            setMetrics(prevMetrics => {
              const totalCrowdMetric = prevMetrics["Total Crowd"];
              if(!totalCrowdMetric) return prevMetrics;

              const currentCrowd = parseInt(totalCrowdMetric.value.replace(/,/g, '')) || 0;
              const newCrowd = crowdData.count;
              const changeType = newCrowd > currentCrowd ? 'increase' : newCrowd < currentCrowd ? 'decrease' : 'neutral';

              return {
                  ...prevMetrics,
                  "Total Crowd": {
                      ...totalCrowdMetric,
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


  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(metrics).map(([title, data]) => {
          const Icon = metricIcons[title];
          if (!Icon) {
            return null;
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
    </div>
  );
}
