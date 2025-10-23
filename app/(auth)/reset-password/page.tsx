import ResetPasswordForm from "./reset-password-form"
import { Suspense } from "react"

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense fallback={<div>Carregando...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}