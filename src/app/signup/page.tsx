"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, ArrowLeft } from "lucide-react";

// Import auth context to perform signup
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const headingFont = "'Bebas Neue', sans-serif";
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  const { signup } = useAuth();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Perform signup via API. The auth context will handle navigation to the
    // member dashboard on success. Any error will be surfaced below the form.
    signup(firstName, lastName, mobile, email, password).catch(err => {
      setError(err.message);
    });
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
          <h1 className="text-3xl font-bold" style={{ fontFamily: headingFont }}>JOIN THE REP</h1>
          <p className="text-sm text-muted-foreground mt-1">Create your member account</p>
        </div>

        <Card className="border-2 border-foreground">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Member Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  required
                />
              </div>
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
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full uppercase font-black text-base">
                CREATE ACCOUNT
              </Button>
            </form>
          {error && (
            <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
          )}
            <p className="text-center text-sm text-muted-foreground mt-4">
              Already a member?{" "}
              <Link href="/login" className="text-foreground font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
