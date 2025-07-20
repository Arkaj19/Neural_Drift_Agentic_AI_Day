import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { alerts } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Zap,
  Users,
  TrendingUp,
  Filter,
  ArrowDownUp,
} from "lucide-react";

const alertDetails = {
  Violence: {
    icon: Zap,
    variant: "destructive" as const,
    color: "bg-red-900/20 border-red-500",
  },
  Crowding: {
    icon: Users,
    variant: "default" as const,
    color: "bg-yellow-900/20 border-yellow-500",
    badgeClass: "bg-yellow-500 text-black",
  },
  "Predicted Crowding": {
    icon: TrendingUp,
    variant: "secondary" as const,
    color: "bg-blue-900/20 border-blue-500",
    badgeClass: "bg-blue-500",
  },
};

export default function AlertsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline">
            <ArrowDownUp className="mr-2 h-4 w-4" /> Sort
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        {alerts.map((alert, index) => {
          const details = alertDetails[alert.type as keyof typeof alertDetails];
          const Icon = details.icon;
          return (
            <Card key={index} className={cn("border-l-4", details.color)}>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                <div className="flex items-center gap-4 md:col-span-2">
                  <div
                    className={cn(
                      "p-2 rounded-full",
                      alert.priority === "High" && "bg-destructive",
                      alert.priority === "Medium" && "bg-yellow-500",
                      alert.priority === "Low" && "bg-blue-500"
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{alert.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.location}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {alert.time}
                </div>
                <div>
                  <Badge
                    variant={details.variant}
                    className={cn(details.badgeClass)}
                  >
                    Priority: {alert.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
