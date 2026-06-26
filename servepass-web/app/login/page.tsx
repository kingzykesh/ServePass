"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { api } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@servepass.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    try {
      setLoading(true);

      const res = await api.post("/api/login", { email, password });

      saveAuth(res.data.data.token, res.data.data.user);
      toast.success("Login successful");

      setTimeout(() => router.push("/dashboard"), 500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toaster position="top-center" />

      <main className="min-h-screen bg-slate-50 px-5 py-8 flex items-center justify-center">
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <section className="text-center lg:text-left">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-green-700">
              MealPass
            </p>

            <h1 className="text-4xl font-black leading-tight text-gray-950 sm:text-5xl lg:text-6xl">
              QR Meal Ticket
              <span className="block text-green-600">
                Management Platform
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
              Generate, distribute, verify and manage meal tickets professionally.
            </p>
          </section>

          <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-black text-gray-950">ServePass</h2>
              <p className="mt-2 text-sm text-gray-500">
                Login to your organization dashboard
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label="Email"
                type="email"
                value={email}
                placeholder="admin@servepass.com"
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button loading={loading} onClick={login}>
                Login
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}