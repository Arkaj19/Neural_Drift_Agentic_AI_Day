'use client';

import { useState } from 'react';
import { Shield, LogIn, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (role === 'user') {
            const userRef = collection(db, 'users');
            const q = query(userRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({
                    title: 'Login Failed',
                    description: 'No user found with this email.',
                    variant: 'destructive',
                });
            } else {
                // In a real app, you would also verify the password.
                // For this demo, we assume the email is enough.
                localStorage.setItem('userEmail', email); // Store user email
                router.push('/user/dashboard');
            }
            return;
        }

        if (role === 'admin') {
            const adminRef = collection(db, 'admin');
            const q = query(
                adminRef,
                where('username', '==', username),
                where('email', '==', email),
                where('password', '==', password),
                where('employee_id', '==', employeeId)
            );

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({
                    title: 'Login Failed',
                    description: 'Invalid admin credentials. Please check your details and try again.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Login Successful',
                    description: 'Welcome back, admin!',
                });
                localStorage.setItem('userEmail', email); // Store admin email
                router.push('/dashboard');
            }
        }
    } catch (error) {
        console.error('Error logging in: ', error);
        toast({
            title: 'Error',
            description: 'An error occurred during login. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              <Icons.shield className="h-16 w-16" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text">Log In</CardTitle>
            <CardDescription>Access your Drishti AI account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Role</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(value) => setRole(value as 'user' | 'admin')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="user" id="user" />
                    <Label htmlFor="user">User</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin">Admin</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className={cn("space-y-2", role === 'user' && 'hidden')}>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="john.doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={role === 'admin'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="operator@drishti.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="DRISHTI-007"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={role === 'user'}
                  required={role === 'admin'}
                  className={cn(role === 'user' && 'bg-muted/50')}
                />
              </div>

              <Button type="submit" className="w-full text-lg font-semibold" size="lg" disabled={loading}>
                {loading ? (
                    <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Logging In...
                    </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Login
                  </>
                )}
              </Button>
               <Button variant="link" size="sm" className="w-full" onClick={() => router.push('/')}>
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
