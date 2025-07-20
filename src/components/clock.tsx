"use client";

import { useState, useEffect } from "react";

export default function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // Set initial time
    setTime(new Date().toLocaleTimeString());

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="text-sm font-medium text-muted-foreground tabular-nums">
      {time || "Loading..."}
    </div>
  );
}
