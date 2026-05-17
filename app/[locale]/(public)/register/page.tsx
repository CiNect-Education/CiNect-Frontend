import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthRegisterForm } from "@/components/auth/auth-register-form";

export default function RegisterPage() {
  return (
    <AuthPageShell activeTab="register">
      <AuthRegisterForm />
    </AuthPageShell>
  );
}
