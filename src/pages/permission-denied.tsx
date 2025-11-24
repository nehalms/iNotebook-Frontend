import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Lock } from "lucide-react";
import { Link } from "wouter";

export default function PermissionDenied() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-destructive/5 p-4">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 pb-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-serif mb-2">Permission Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to access this feature.
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Please contact your administrator if you believe this is an error.
            </p>
            <Link href="/">
              <button className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Go to Dashboard
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

