import { redirect } from 'next/navigation';

export default function AdminRootPage() {
  // Admins are redirected to the main dashboard.
  redirect('/dashboard');
}
