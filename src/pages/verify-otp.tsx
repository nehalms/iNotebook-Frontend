import { useState } from "react";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface VerifyOtpPageProps {
  onVerifyOtp?: (otp: string) => Promise<void>;
  onResendOtp?: () => Promise<void>;
  email?: string;
}

export default function VerifyOtpPage({
  onVerifyOtp,
  onResendOtp,
  email,
}: VerifyOtpPageProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setIsLoading(true);
    try {
      await onVerifyOtp?.(otp);
    } catch (error) {
      console.error("OTP verification error:", error);
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResendOtp?.();
    } catch (error) {
      console.error("Resend OTP error:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold font-serif">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-base">
            {email
              ? `Enter the 6-digit code sent to ${email}`
              : "Enter the 6-digit code sent to your email"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-6">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
              data-testid="input-otp"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <Button
              onClick={handleVerify}
              className="w-full h-12 text-base"
              disabled={isLoading || otp.length !== 6}
              data-testid="button-verify-otp"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isResending}
              data-testid="button-resend-otp"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </Button>
          </div>

          <Link href="/login">
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              data-testid="button-back-to-login"
            >
              Back to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
