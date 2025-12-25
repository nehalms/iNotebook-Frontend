import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OtpVerificationProps {
  onVerify: (code: number) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading?: boolean;
  isVerifying?: boolean;
  message?: string;
}

export function OtpVerification({
  onVerify,
  onResend,
  isLoading = false,
  isVerifying = false,
  message = "Enter the verification code",
}: OtpVerificationProps) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value)) && element.value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus next input
    if (element.value && element.nextSibling && index < 5) {
      (element.nextSibling as HTMLInputElement).focus();
    }

    // Auto-verify when 6th digit is entered
    if (index === 5 && element.value && newOtp.join("").length === 6) {
      setTimeout(() => {
        handleVerify(newOtp);
      }, 100);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpArray?: string[]) => {
    const codeToVerify = otpArray ? otpArray.join("") : otp.join("");
    if (codeToVerify.length === 6) {
      try {
        await onVerify(parseInt(codeToVerify));
      } catch (error) {
        // Reset OTP on error
        setOtp(new Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
      toast({
        title: "OTP Sent",
        description: "A new verification code has been sent to your email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <label className="text-sm font-medium">{message}</label>
      <div className="space-y-3 w-full">
        <div className="flex gap-1 min-[350px]:gap-1.5 sm:gap-2 justify-center items-center w-full max-w-full overflow-visible">
          {otp.map((value, index) => (
            <Input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="h-9 min-[350px]:h-10 sm:h-12 w-9 min-[350px]:w-10 sm:w-12 min-w-[2.25rem] min-[350px]:min-w-[2.5rem] sm:min-w-[3rem] flex-shrink-0 text-center text-sm min-[350px]:text-base sm:text-lg font-semibold"
              disabled={isLoading}
              data-testid={`otp-input-${index}`}
            />
          ))}
        </div>
        <div className="flex justify-center gap-2">
          {isLoading || isVerifying ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={isResending}
                className="gap-2"
                data-testid="button-resend-otp"
              >
                <Mail className="h-4 w-4" />
                {isResending ? "Sending..." : "Resend"}
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => handleVerify()}
                disabled={otp.join("").length !== 6 || isResending}
                className="gap-2"
                data-testid="button-verify-otp"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isVerifying ? "Verifying..." : "Verify"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

