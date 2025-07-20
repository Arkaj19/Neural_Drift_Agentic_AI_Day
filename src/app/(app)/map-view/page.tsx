import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { sectors } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Maximize, RefreshCw } from "lucide-react";
import Image from 'next/image';

const getStatusColor = (status: "normal" | "alert") => {
  return status === "alert" ? "text-red-400" : "text-green-400";
};

const getProgressColor = (capacity: number) => {
  if (capacity > 90) return "bg-red-500";
  if (capacity > 75) return "bg-yellow-500";
  return "bg-accent";
};

export default function MapViewPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button variant="outline">
            <Maximize className="mr-2 h-4 w-4" /> Full Screen
          </Button>
        </div>
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Venue Layout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full bg-muted rounded-lg">
                <Image src="https://placehold.co/1200x800.png" alt="Venue Map" width={1200} height={800} data-ai-hint="venue map" className="w-full h-full object-cover" />
            </div>
             <p className="text-xs text-muted-foreground mt-2 text-right">100m scale</p>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Map Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-green-500"></span>
              <span>Normal Status</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-red-500"></span>
              <span>Alert Status</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-blue-500"></span>
              <span>Key Location</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sector Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectors.map((sector) => (
              <div key={sector.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className={cn("font-medium", getStatusColor(sector.status))}>{sector.name}</span>
                  <span className="text-muted-foreground">{sector.capacity}%</span>
                </div>
                <Progress value={sector.capacity} className="h-2 [&>div]:" indicatorClassName={getProgressColor(sector.capacity)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
