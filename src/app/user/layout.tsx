import Header from "@/components/header";
import { UserProfileProvider } from "@/hooks/use-user-profile";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProfileProvider>
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
            <Header />
            <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</main>
        </div>
    </UserProfileProvider>
  );
}
