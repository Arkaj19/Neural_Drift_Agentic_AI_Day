import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { guards, keyMetrics } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  Users,
  ShieldAlert,
  Signal,
  Phone,
} from "lucide-react";

const metricIcons = {
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
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(keyMetrics).map(([title, data]) => {
          const Icon = metricIcons[title as keyof typeof metricIcons];
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
                      "text-red-400": title === "Active Alerts" && data.changeType === "increase",
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
                <TableRow key={guard.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={`https://i.pravatar.cc/40?u=${guard.name}`} />
                        <AvatarFallback>{guard.name.charAt(0)}</AvatarFallback>
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
