
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
import { Droplets, Eye, EyeOff, Mail } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }).trim().toLowerCase(),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
});
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;


export function LoginForm() {
  const { login, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "password",
      rememberMe: false,
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
      resolver: zodResolver(forgotPasswordSchema),
      defaultValues: {
          email: ""
      }
  });

  async function onLoginSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    await login(values.email, values.password);
    setIsSubmitting(false);
  }

  async function onForgotPasswordSubmit(values: ForgotPasswordFormValues) {
      setIsSendingReset(true);
      try {
        const response = await fetch('/api/generate-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          toast({
            title: "Link Generated in Console",
            description: "A password reset link has been generated in the server console for you to share.",
          });
          setForgotPasswordOpen(false);
          forgotPasswordForm.reset();
        } else {
          toast({
            variant: "destructive",
            title: "Error Generating Link",
            description: result.message || "An unexpected error occurred.",
          });
        }
      } catch (error) {
         toast({
            variant: "destructive",
            title: "Request Failed",
            description: "Could not connect to the server. Please try again.",
          });
      } finally {
        setIsSendingReset(false);
      }
  }

  const isLoading = authLoading || isSubmitting;
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <>
    <Form {...loginForm}>
      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
        <FormField
          control={loginForm.control}
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
          control={loginForm.control}
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
        <div className="flex items-center justify-between">
            <FormField
            control={loginForm.control}
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
            <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => setForgotPasswordOpen(true)}>
                Forgot Password?
            </Button>
        </div>


        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle" />}
          Login
        </Button>
      </form>
    </Form>

    <Dialog open={isForgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Generate Password Reset Link</DialogTitle>
                <DialogDescription>
                    Enter an email address. A password reset link will be generated in the server console for you to copy and share.
                </DialogDescription>
            </DialogHeader>
            <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                    <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="forgot-email" className="sr-only">Email</Label>
                                <FormControl>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id="forgot-email" type="email" placeholder="your.email@example.com" {...field} className="pl-10"/>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost" disabled={isSendingReset}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSendingReset}>
                            {isSendingReset && <Droplets className="mr-2 h-4 w-4 animate-pulse-subtle"/>}
                            Generate Link
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
    </>
  );
}
