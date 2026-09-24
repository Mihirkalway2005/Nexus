"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NexusGlyph } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Form Validation Schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle Email & Password Sign In
  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: redirectTo,
      });

      if (response.error) {
        setErrorMsg(response.error.message || "Invalid email or password.");
      } else {
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "A network error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);

    try {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });

      if (res?.error) {
        if (res.error.code === "PROVIDER_NOT_FOUND" || res.error.message?.includes("Provider not found")) {
          setErrorMsg(
            "Google Sign-In is not configured yet. Please set your Google Client ID & Secret in Convex, or use email and password."
          );
        } else {
          setErrorMsg(res.error.message || "Google Sign-In failed. Please try again.");
        }
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not connect to Google OAuth."
      );
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#09090b] text-zinc-100 font-sans">
      {/* Background subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-800 bg-[#0c0c0e] text-white">
            <NexusGlyph className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="font-mono text-base font-bold tracking-wider uppercase text-white">
              NEXUS
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
              SYS // 01
            </span>
          </div>
          <p className="mt-1 text-xs font-mono text-zinc-500 uppercase tracking-wider">
            AUTHENTICATION GATEWAY
          </p>
        </div>

        <Card className="rounded-md border-zinc-800 bg-[#0c0c0e] shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              Sign In // Credentials
            </CardTitle>
            <CardDescription className="text-xs font-mono text-zinc-500">
              Enter university email and access credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-md border border-rose-500/40 bg-rose-950/20 p-3 text-xs font-mono text-rose-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-mono text-xs text-zinc-300">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@university.edu"
                  {...register("email")}
                  disabled={isLoading || isGoogleLoading}
                  className="rounded-md border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs placeholder-zinc-500"
                />
                {errors.email && (
                  <p className="text-[11px] font-mono text-rose-400 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="font-mono text-xs text-zinc-300">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="font-mono text-[11px] text-zinc-400 hover:text-white transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading || isGoogleLoading}
                  className="rounded-md border-zinc-800 bg-zinc-900/80 text-white font-mono text-xs placeholder-zinc-500"
                />
                {errors.password && (
                  <p className="text-[11px] font-mono text-rose-400 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                variant="default"
                className="w-full font-mono text-xs font-semibold uppercase tracking-wider rounded-md h-10 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  "AUTHENTICATE // SIGN IN"
                )}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                <span className="bg-[#0c0c0e] px-2 text-zinc-500">
                  Or OAuth Provider
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full font-mono text-xs rounded-md h-10 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Google SSO
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-800/80 pt-4">
            <p className="text-xs font-mono text-zinc-500">
              New student?{" "}
              <Link
                href="/signup"
                className="font-medium text-white hover:underline transition-colors ml-1"
              >
                Register profile
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
