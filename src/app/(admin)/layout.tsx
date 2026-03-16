import AuthGuard from "@/components/layout/AuthGuard";
import Sidebar from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-4 pt-16 lg:pt-8 lg:p-8 transition-all duration-300">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
