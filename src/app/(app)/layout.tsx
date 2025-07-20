import Header from "@/components/header";
import MainNav from "@/components/main-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <MainNav />
        <main>{children}</main>
      </div>
    </div>
  );
}
