import { AppProvider } from "@/lib/contexts/app-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <div className="min-h-screen">
        {children}
      </div>
    </AppProvider>
  );
}