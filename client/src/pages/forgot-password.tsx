import { useState } from "react";
import { Link } from "wouter";
import { KeyRound, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordPageProps {
  onSendResetEmail?: (email: string) => Promise<void>;
}

export default function ForgotPasswordPage({
  onSendResetEmail,
}: ForgotPasswordPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      await onSendResetEmail?.(data.email);
      setEmailSent(true);
    } catch (error) {
      console.error("Reset email error:", error);
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
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-center">
                  If an account exists with this email, you will receive a
                  password reset link shortly.
                </p>
              </div>

              <Link href="/login">
                <Button
                  variant="default"
                  className="w-full h-12 text-base gap-2"
                  data-testid="button-back-to-login"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
