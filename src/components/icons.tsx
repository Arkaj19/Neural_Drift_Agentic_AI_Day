import Image from "next/image";
import { cn } from "@/lib/utils";

export const Icons = {
  shield: ({ className }: { className?: string }) => (
    <Image
      src="https://res.cloudinary.com/dams0r5uk/image/upload/v1753526208/Picture1_wlf2zp.jpg"
      alt="Drishti AI Logo"
      width={80}
      height={80}
      className={cn("rounded-full", className)}
    />
  ),
};
