import { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserPlus } from "lucide-react";
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
import { signup, checkUserAndSendOtp } from "@/lib/api/auth";
import { verifyOtp } from "@/lib/api/email";
import { encryptMessage } from "@/lib/utils/encryption";
import { useSessionStore } from "@/store/sessionStore";

const signupSchema = z
  .object({
    name: z
      .string()
      .min(5, "Name must be at least 5 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupPageProps {
  onSignup?: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
}

export default function SignupPage({ onSignup }: SignupPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isVerifyingUser, setIsVerifyingUser] = useState(false);
  const [formData, setFormData] = useState<SignupFormValues | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });


  const handleVerifyOtp = async (code: number) => {
    if (!formData) return;

    setIsVerifyingOtp(true);
    try {
      const response = await verifyOtp({
        email: formData.email,
        code: code.toString(),
      });

      if (response.success && response.verified) {
        setIsEmailVerified(true);
        // Keep showOtp true to stay on OTP view, proceed with signup
        await proceedWithSignup(formData);
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

  const handleResendOtp = async () => {
    if (!formData) return;
    setIsLoading(true);
    try {
      const encryptedEmail = await encryptMessage(formData.email);
      await checkUserAndSendOtp(encryptedEmail, 'signup');
      toast({
        title: "OTP Sent",
        description: "A new verification code has been sent to your email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const proceedWithSignup = async (data: SignupFormValues) => {
    setIsLoading(true);
    try {
      // Encrypt data before sending
      const encryptedName = await encryptMessage(data.name);
      const encryptedEmail = await encryptMessage(data.email);
      const encryptedPassword = await encryptMessage(data.password);

      const response = await signup({
        name: encryptedName,
        email: encryptedEmail,
        password: encryptedPassword,
      });

      if (response.success) {
        // Update session store
        useSessionStore.getState().login({
          email: data.email,
          isAdmin: false,
          permissions: response.permissions || [],
          isPinSet: response.isPinSet || false,
        });

        // Fetch secret key for encryption
        await useSessionStore.getState().fetchAndSetSecretKey();

        toast({
          title: "Success",
          description: "Account created successfully",
        });
        await onSignup?.(data.name, data.email, data.password);
        setLocation("/");
      } else {
        toast({
          title: "Error",
          description: response.error || "Signup failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Signup failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    // Store form data
    setFormData(data);
    setIsVerifyingUser(true);
    try {
      // Encrypt email before sending
      const encryptedEmail = await encryptMessage(data.email);
      
      // Check if user exists and send OTP
      const response = await checkUserAndSendOtp(encryptedEmail, 'signup');
      
      if (response.success) {
        setShowOtp(true);
        setIsEmailVerified(false);
        toast({
          title: "OTP Sent",
          description: response.message || "Verification code has been sent to your email",
        });
      } else {
        // Check if error is about user already existing
        const errorMsg = response.error || "Failed to send OTP";
        if (errorMsg.includes("already exists") || errorMsg.includes("user with this email")) {
          // Redirect to login with email pre-populated
          const encodedEmail = encodeURIComponent(data.email);
          setLocation(`/login?email=${encodedEmail}`);
          toast({
            title: "Account Already Exists",
            description: "This email is already registered. Redirecting to login...",
            variant: "default",
          });
        } else {
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to check user and send OTP";
      
      if (errorMessage.includes("already exists") || errorMessage.includes("user with this email")) {
        const encodedEmail = encodeURIComponent(data.email);
        setLocation(`/login?email=${encodedEmail}`);
        toast({
          title: "Account Already Exists",
          description: "This email is already registered. Redirecting to login...",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsVerifyingUser(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
            <UserPlus className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold font-serif">
            Create Account
          </CardTitle>
          <CardDescription className="text-base">
            Get started with iNotebook today
          </CardDescription>
        </CardHeader>

        <CardContent>
          {showOtp ? (
            <div className="space-y-4">
              {isEmailVerified && isLoading ? (
                <div className="p-4 border rounded-lg bg-muted/50 text-center space-y-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Creating your account...</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <OtpVerification
                    onVerify={handleVerifyOtp}
                    onResend={handleResendOtp}
                    isLoading={isVerifyingOtp}
                    message="Enter the verification code sent to your email"
                  />
                </div>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your full name"
                          data-testid="input-name"
                          disabled={isLoading || isVerifyingUser}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          placeholder="your@email.com"
                          data-testid="input-email"
                          disabled={isLoading || isVerifyingUser}
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
                          placeholder="Create a password (min 6 characters)"
                          data-testid="input-password"
                          disabled={isLoading || isVerifyingUser}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm your password"
                          data-testid="input-confirm-password"
                          disabled={isLoading || isVerifyingUser}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isLoading || isVerifyingUser}
                  data-testid="button-signup"
                >
                  {isLoading ? "Sending OTP..." : isVerifyingUser ? "Verifying..." : "Create Account"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <a
                className="text-primary font-medium hover:underline"
                data-testid="link-login"
              >
                Sign in
              </a>
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
