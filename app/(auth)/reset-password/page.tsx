import ResetPasswordForm from "./reset-password-form"
import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col gap-4 p-6 md:p-10 min-h-screen">
        <div className="flex justify-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={80}
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin mx-auto mb-4 rounded-full border-4 border-gray-300 border-t-blue-600" />
                  <p className="text-gray-600">Carregando...</p>
                </div>
              </div>
            }>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}