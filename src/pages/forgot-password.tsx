import { useState } from "react";
import { Link, useLocation } from "wouter";
import { KeyRound, ArrowLeft } from "lucide-react";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OtpVerification } from "@/components/otp-verification";
import { getPassword, updatePassword } from "@/lib/api/auth";
import { sendOtpEmail, verifyOtp } from "@/lib/api/email";
import { encryptMessage } from "@/lib/utils/encryption";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordPageProps {
  onSendResetEmail?: (email: string) => Promise<void>;
}

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [userData, setUserData] = useState<{ _id: string; email: string } | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      // Encrypt email before checking
      const encryptedEmail = await encryptMessage(data.email);
      // Check if user exists
      const response = await getPassword(encryptedEmail);
      if (response.found && response.user) {
        setUserData({ _id: response.user._id, email: data.email });
        // Send OTP email
        await sendOtpEmail({
          email: data.email,
          cc: [],
          subject: "Reset Password",
          text: "",
        });
        setEmailSent(true);
        setShowOtp(true);
        toast({
          title: "OTP Sent",
          description: "Verification code has been sent to your email",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "No user found with this email",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Reset email error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: number) => {
    if (!userData) return;

    setIsVerifyingOtp(true);
    try {
      const response = await verifyOtp({
        email: userData.email,
        code: code.toString(),
      });

      if (response.success && response.verified) {
        setOtpVerified(true);
        setShowOtp(false);
        toast({
          title: "OTP Verified",
          description: "Please enter your new password",
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

  const handleResendOtp = async () => {
    if (!userData) return;
    await sendOtpEmail({
      email: userData.email,
      cc: [],
      subject: "Reset Password",
      text: "",
    });
    toast({
      title: "OTP Sent",
      description: "A new verification code has been sent to your email",
    });
  };

  const onResetPassword = async (data: ResetPasswordFormValues) => {
    if (!userData) return;

    setIsLoading(true);
    try {
      // Encrypt password before sending
      const encryptedId = await encryptMessage(userData._id);
      const encryptedEmail = await encryptMessage(userData.email);
      const encryptedPassword = await encryptMessage(data.password);
      await updatePassword(encryptedId, encryptedEmail, encryptedPassword);
      toast({
        title: "Success",
        description: "Password updated successfully. Please login with your new password.",
      });
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
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
            <KeyRound className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold font-serif">
            {emailSent ? "Check Your Email" : "Forgot Password?"}
          </CardTitle>
          <CardDescription className="text-base">
            {emailSent
              ? "We've sent you a reset link to your email address"
              : "Enter your email to receive a password reset link"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!emailSent ? (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your@email.com"
                          data-testid="input-email"
                          disabled={isLoading}
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
                  disabled={isLoading}
                  data-testid="button-send-reset"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <Link href="/login">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-12 text-base gap-2"
                    data-testid="button-back-to-login"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </form>
            </Form>
          ) : !otpVerified ? (
            <div className="space-y-4">
              {showOtp && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <OtpVerification
                    onVerify={handleVerifyOtp}
                    onResend={handleResendOtp}
                    isLoading={isVerifyingOtp}
                    message="Enter the verification code sent to your email"
                  />
                </div>
              )}
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base gap-2"
                  data-testid="button-back-to-login"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <Form {...resetForm}>
              <form
                onSubmit={resetForm.handleSubmit(onResetPassword)}
                className="space-y-4"
              >
                <FormField
                  control={resetForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Enter new password"
                          data-testid="input-new-password"
                          disabled={isLoading}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Confirm new password"
                          data-testid="input-confirm-password"
                          disabled={isLoading}
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
                  disabled={isLoading}
                  data-testid="button-reset-password"
                >
                  {isLoading ? "Updating..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
