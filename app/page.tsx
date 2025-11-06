import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex items-center justify-center flex-1 flex-col min-h-screen">
      <h1 className="text-5xl mb-12">Futura Landing Page</h1>
      <Link href="/login">
        <Button>Login</Button>
      </Link>
    </div>
  )
}
