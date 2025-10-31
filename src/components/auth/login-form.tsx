
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Droplets, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }).trim().toLowerCase(),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const { login, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "password",
      rememberMe: false,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    await login(values.email, values.password);
    setIsSubmitting(false);
  }

  const isLoading = authLoading || isSubmitting;

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    {...field}
                    className="pr-10 hover:border-primary/80 focus:border-primary"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} id="rememberMe" />
              </FormControl>
              <Label htmlFor="rememberMe" className="font-normal text-sm text-muted-foreground cursor-pointer">
                Remember Me
              </Label>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
          Login
        </Button>
      </form>
    </Form>
  );
}
