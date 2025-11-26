import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Lock, CheckCircle2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OtpVerification } from "@/components/otp-verification";
import { login, sendAdminOtp } from "@/lib/api/auth";
import { verifyOtp } from "@/lib/api/email";
import { encryptMessage } from "@/lib/utils/encryption";
import { useSessionStore } from "@/store/sessionStore";
import { queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onLogin?: (email: string, password: string) => Promise<void>;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [showAdminOtp, setShowAdminOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Get email from query parameter
  const getEmailFromQuery = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('email') || '';
  };

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const emailFromQuery = getEmailFromQuery();
    if (emailFromQuery) {
      form.setValue('email', emailFromQuery);
      // Show a toast message
      toast({
        title: "Account Already Exists",
        description: "This email is already registered. Please sign in instead.",
        variant: "default",
      });
    }
  }, []);

  const email = form.watch("email");

  const handleSendAdminOtp = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      // Encrypt email before sending
      const encryptedEmail = await encryptMessage(email);
      await sendAdminOtp(encryptedEmail);
      setShowAdminOtp(true);
      setIsAdminVerified(false);
      toast({
        title: "OTP Sent",
        description: "Admin passkey has been sent to your email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAdminOtp = async (code: number) => {
    if (!email) return;

    setIsVerifyingOtp(true);
    try {
      const response = await verifyOtp({
        email: email,
        code: code.toString(),
      });

      if (response.success && response.verified) {
        setIsAdminVerified(true);
        setShowAdminOtp(false);
        toast({
          title: "Admin Passkey Verified",
          description: "Admin passkey verified successfully",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: response.msg || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendAdminOtp = async () => {
    await handleSendAdminOtp();
  };

  const onSubmit = async (data: LoginFormValues) => {
    if (isAdminUser && !isAdminVerified) {
      toast({
        title: "Admin Passkey Required",
        description: "Please verify admin passkey before logging in",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Encrypt credentials before sending
      const encryptedEmail = await encryptMessage(data.email);
      const encryptedPassword = await encryptMessage(data.password);

      const response = await login({
        email: encryptedEmail,
        password: encryptedPassword,
      }, isAdminVerified);

      if (response.success) {
        if (response.isAdminUser && !isAdminUser) {
          // First time detecting admin user
          setIsAdminUser(true);
          setIsLoading(false);
          handleSendAdminOtp();
          return;
        }

        // Clear React Query cache to ensure fresh data for the new user
        queryClient.clear();
        
        // Update session store
        // Note: isPinVerified is set to false on login (handled by backend)
        useSessionStore.getState().login({
          email: data.email,
          isAdmin: response.isAdminUser || false,
          permissions: response.permissions || [],
          isPinSet: response.isPinSet || false,
          isPinVerified: false,
        });

        // Fetch secret key for encryption
        await useSessionStore.getState().fetchAndSetSecretKey();

        toast({
          title: "Success",
          description: `Logged in successfully${response.isAdminUser ? " as Admin" : ""}`,
        });
        await onLogin?.(data.email, data.password);
        setLocation("/");
      } else {
        toast({
          title: "Error",
          description: response.error || "Login failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold font-serif">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to your iNotebook account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        data-testid="input-email"
                        disabled={isLoading || isAdminUser}
                        className="h-12"
                      />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        data-testid="input-password"
                        disabled={isLoading || isAdminUser}
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdminVerified && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Admin passkey verified</span>
                </div>
              )}

              {isAdminUser && !isAdminVerified && showAdminOtp && (
                <div className="p-4 border rounded-lg bg-muted/50 w-full max-w-full overflow-visible min-[350px]:overflow-hidden">
                  <OtpVerification
                    onVerify={handleVerifyAdminOtp}
                    onResend={handleResendAdminOtp}
                    isLoading={isVerifyingOtp}
                    message="Enter Admin Passkey"
                  />
                </div>
              )}

              {!isAdminUser && (
                <div className="flex justify-end">
                  <Link href="/forgot-password">
                    <a className="text-sm text-primary hover:underline">
                      Forgot password?
                    </a>
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading || isSendingOtp || isVerifyingOtp || (isAdminUser && !isAdminVerified)}
                data-testid="button-login"
              >
                { 
                  isLoading ? "Signing in..." : 
                  isSendingOtp ? "Sending OTP..." :
                  isVerifyingOtp ? "Verifying..." :
                  isAdminUser && !isAdminVerified ? "Verify Admin Passkey" : 
                  "Sign In"
                }
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup">
              <a
                className="text-primary font-medium hover:underline"
                data-testid="link-signup"
              >
                Sign up
              </a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
