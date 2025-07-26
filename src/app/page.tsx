'use client';

import { Shield, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center">
              <Icons.shield className="h-20 w-20" />
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text">Drishti AI</CardTitle>
            <CardDescription className="text-lg">Event Guardian</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Button
              onClick={() => router.push('/login')}
              className="w-full text-lg font-semibold"
              size="lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Log In
            </Button>
            <Button
              onClick={() => router.push('/signup')}
              variant="outline"
              className="w-full text-lg font-semibold"
              size="lg"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
