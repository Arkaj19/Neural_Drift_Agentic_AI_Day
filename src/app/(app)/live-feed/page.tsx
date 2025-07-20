import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cameras } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Video,
  Signal,
  Users,
  Maximize,
  RefreshCw,
  Dot,
} from "lucide-react";
import Image from 'next/image';

const getStatusBadgeVariant = (status: "Recording" | "Alert" | "Normal") => {
  switch (status) {
    case "Recording":
      return "default";
    case "Alert":
      return "destructive";
    case "Normal":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusColor = (status: "Recording" | "Alert" | "Normal") => {
    switch (status) {
      case "Recording":
        return "border-blue-500";
      case "Alert":
        return "border-red-500";
      case "Normal":
        return "border-gray-500";
      default:
        return "border-transparent";
    }
  };

export default function LiveFeedPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh All
        </Button>
        <Button variant="outline">
          <Maximize className="mr-2 h-4 w-4" /> Full Screen
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cameras.map((camera) => (
          <Card key={camera.id} className={cn("flex flex-col", getStatusColor(camera.status), "border-2")}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{camera.id}</CardTitle>
              <Badge variant={getStatusBadgeVariant(camera.status)}>
                {camera.status}
              </Badge>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
                 <Image src={`https://placehold.co/600x400.png`} alt={`Live feed from ${camera.location}`} width={600} height={400} data-ai-hint="cctv footage" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm font-medium text-foreground mt-2">{camera.location}</p>
            </CardContent>
            <CardFooter className="flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>
                  {camera.resolution} @ {camera.fps}fps
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{camera.viewers}</span>
              </div>
              {camera.isRecording && (
                <div className="flex items-center gap-1 text-red-400">
                  <Dot className="h-6 w-6 animate-pulse" />
                  <span>REC</span>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
         {Array.from({ length: 0 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="aspect-video w-full" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-10" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
