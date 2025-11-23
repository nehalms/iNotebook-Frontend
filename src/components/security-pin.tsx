import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OtpVerification } from "@/components/otp-verification";
import { verifySecurityPin, setSecurityPin } from "@/lib/api/securityPin";
import { sendOtpEmail, verifyOtp } from "@/lib/api/email";
import { useSessionStore } from "@/store/sessionStore";

interface SecurityPinProps {
  mode: "verify" | "set";
  onSuccess: () => void;
  onCancel?: () => void;
}

export function SecurityPin({ mode, onSuccess, onCancel }: SecurityPinProps) {
  const [pin, setPin] = useState<string[]>(new Array(6).fill(""));
  const [confirmPin, setConfirmPin] = useState<string[]>(new Array(6).fill(""));
  const [step, setStep] = useState<"enter" | "confirm" | "forgot" | "verify">(mode === "set" ? "enter" : "verify");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const { email } = useSessionStore();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [step]);

  const handleChange = (
    element: HTMLInputElement,
    index: number,
    isConfirm: boolean = false
  ) => {
    if (!/^\d$/.test(element.value) && element.value !== "") return;

    setError(null);
    const targetPin = isConfirm ? confirmPin : pin;
    const newPin = [...targetPin];
    newPin[index] = element.value;
    
    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    if (element.value && element.nextSibling && index < 5) {
      (element.nextSibling as HTMLInputElement).focus();
    }

    if (index === 5 && element.value) {
      if (isConfirm) {
        handleConfirmPin(newPin);
      } else if (step === "verify") {
        handleVerifyPin(newPin.join(""));
      } else if (step === "enter" && mode === "set") {
        // Move to confirm step
        setStep("confirm");
        setTimeout(() => confirmInputRefs.current[0]?.focus(), 100);
      }
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    isConfirm: boolean = false
  ) => {
    const targetPin = isConfirm ? confirmPin : pin;
    if (event.key === "Backspace" && !targetPin[index] && index > 0) {
      const refs = isConfirm ? confirmInputRefs : inputRefs;
      refs.current[index - 1]?.focus();
    }
  };

  const handleVerifyPin = async (pinCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await verifySecurityPin(pinCode);
      if (response.status === 1) {
        useSessionStore.getState().setPinVerified(true);
        toast({
          title: "Success",
          description: "Security pin verified",
        });
        onSuccess();
      } else {
        setError(response.msg || "Invalid pin");
        setPin(new Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to verify pin");
      setPin(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPin = (confirmPinArray: string[]) => {
    if (pin.join("") === confirmPinArray.join("")) {
      handleSetPin(pin.join(""));
    } else {
      setError("Pin does not match. Please try again.");
      setPin(new Array(6).fill(""));
      setConfirmPin(new Array(6).fill(""));
      setStep("enter");
      inputRefs.current[0]?.focus();
    }
  };

  const handleSetPin = async (pinCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await setSecurityPin(pinCode);
      if (response.status === 1) {
        useSessionStore.getState().setPinVerified(true);
        toast({
          title: "Success",
          description: "Security pin set successfully",
        });
        onSuccess();
      } else {
        setError(response.error || "Failed to set pin");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to set pin");
      setPin(new Array(6).fill(""));
      setConfirmPin(new Array(6).fill(""));
      setStep("enter");
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendOtpEmail({
        email: email,
        cc: [],
        subject: "Reset security pin",
        text: "",
      });
      setIsForgotMode(true);
      setStep("forgot");
      setPin(new Array(6).fill(""));
      toast({
        title: "OTP Sent",
        description: "OTP has been sent to your email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: number) => {
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await verifyOtp({
        email: email,
        code: code.toString(),
      });

      if (response.success && response.verified) {
        setIsForgotMode(false);
        setStep("enter");
        setPin(new Array(6).fill(""));
        toast({
          title: "OTP Verified",
          description: "Please set a new security pin",
        });
      } else if (response.status === 0) {
        await handleForgotPin();
        toast({
          title: "OTP Expired",
          description: response.msg + ". New OTP has been sent to your email",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: response.msg || "Invalid OTP",
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
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    await handleForgotPin();
  };

  const getTitle = () => {
    if (isForgotMode) return "Enter OTP to reset pin";
    if (step === "confirm") return "Confirm your Security pin";
    if (mode === "set") return "Please set the Security pin to secure your data";
    return "Enter the Security pin";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-serif">{getTitle()}</h2>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && (
            <>
              {isForgotMode && step === "forgot" ? (
                <div className="space-y-4">
                  <OtpVerification
                    onVerify={handleVerifyOtp}
                    onResend={handleResendOtp}
                    isLoading={isLoading}
                    message="Enter OTP to reset pin"
                  />
                </div>
              ) : !isForgotMode ? (
                <div className="space-y-4">
                  <div className="flex gap-2 justify-center">
                    {pin.map((value, index) => (
                      <Input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={(e) => handleChange(e.target, index, false)}
                        onKeyDown={(e) => handleKeyDown(e, index, false)}
                        className="h-14 w-14 text-center text-xl font-semibold"
                        disabled={isLoading}
                        data-testid={`pin-input-${index}`}
                      />
                    ))}
                  </div>

                  {step === "confirm" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-center block">
                        Confirm Pin
                      </label>
                      <div className="flex gap-2 justify-center">
                        {confirmPin.map((value, index) => (
                          <Input
                            key={index}
                            ref={(el) => (confirmInputRefs.current[index] = el)}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={value}
                            onChange={(e) => handleChange(e.target, index, true)}
                            onKeyDown={(e) => handleKeyDown(e, index, true)}
                            className="h-14 w-14 text-center text-xl font-semibold"
                            disabled={isLoading}
                            data-testid={`confirm-pin-input-${index}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}
                </div>
              ) : null}

              {mode === "verify" && step === "verify" && !isForgotMode && (
                <div className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleForgotPin}
                    className="text-sm"
                    data-testid="button-forgot-pin"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Forgot pin?
                  </Button>
                </div>
              )}

              {onCancel && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

