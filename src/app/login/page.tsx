"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Crown, Dumbbell, UserCircle, ArrowLeft } from "lucide-react";
import type { Role } from "@/lib/types";

// Pull in auth hooks to perform login
import { useAuth } from "@/lib/auth-context";
import { signIn as signInProvider } from "next-auth/react";

const roles: { value: Role; label: string; icon: React.ReactNode }[] = [
  { value: "owner", label: "Gym Owner", icon: <Crown size={20} /> },
  { value: "trainer", label: "Trainer", icon: <Dumbbell size={20} /> },
  { value: "member", label: "Member", icon: <UserCircle size={20} /> },
];

export default function LoginPage() {
  const headingFont = "'Bebas Neue', sans-serif";
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const activeRole = roles.find(r => r.value === selectedRole)!;

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setEmail("");
    setPassword("");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Call the API via AuthContext. Provide selectedRole as a hint so that
    // the AuthContext can navigate to the correct dashboard once the
    // response is received. Errors thrown by login() will be caught and
    // displayed to the user.
    login(email, password, selectedRole).catch(err => {
      setError(err.message);
    });
  };

  // Trigger Google OAuth login via NextAuth. This bypasses the credentials form
  // entirely and directs the user to Google's consent screen.
  const handleGoogleLogin = async () => {
    // Passing callbackUrl ensures that upon successful sign in the user is
    // redirected back to the appropriate dashboard. The role for Google
    // accounts defaults to MEMBER via Prisma default on User.role.
    await signInProvider('google', { callbackUrl: '/dashboard/member' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to home
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Zap size={28} className="text-primary" />
            <span className="text-2xl font-bold" style={{ fontFamily: headingFont }}>SoulRep</span>
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: headingFont }}>WELCOME BACK</h1>
          <p className="text-sm text-muted-foreground mt-1">Log in to your account</p>
        </div>

        <Card className="border-2 border-foreground">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Login as</CardTitle>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {roles.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleRoleChange(r.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 border-2 transition-all text-sm font-bold uppercase ${
                    selectedRole === r.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  {r.icon}
                  <span className="text-xs">{r.label}</span>
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full uppercase font-black text-base">
                LOG IN AS {activeRole.label}
              </Button>
            </form>

            {selectedRole === "member" && (
              <>
                <div className="flex items-center my-4">
                  <hr className="flex-grow border-muted" />
                  <span className="mx-2 text-muted-foreground text-xs uppercase">or</span>
                  <hr className="flex-grow border-muted" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full uppercase font-black text-base"
                  onClick={handleGoogleLogin}
                >
                  CONTINUE WITH GOOGLE
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  New here?{" "}
                  <Link href="/signup" className="text-foreground font-semibold hover:underline">
                    Sign up as a member
                  </Link>
                </p>
              </>
            )}
            {selectedRole === "trainer" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Trainers are added by the gym owner. Contact the front desk if you need access.
              </p>
            )}
            {selectedRole === "owner" && (
              <p className="text-center text-xs text-muted-foreground mt-4">
                Owner account is pre-seeded. No signup required.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
