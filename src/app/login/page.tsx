"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Bus } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl mb-6">
            <Bus className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ETBP Admin</h1>
          <p className="mt-2 text-gray-400 max-w-sm">
            Enviable Transport Booking Platform — Manage routes, schedules, fleet, and bookings.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500 rounded-xl mb-4">
              <Bus className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ETBP Admin</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-500 mb-8">Sign in to your admin account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="admin@enviabletransport.com"
              {...register("email")}
              error={errors.email?.message}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              error={errors.password?.message}
            />

            {loginMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {(loginMutation.error as Error)?.message?.includes("401")
                  ? "Invalid email or password"
                  : "Login failed. Please try again."}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loginMutation.isPending}>
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
