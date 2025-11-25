import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionStore } from "@/store/sessionStore";
import { getUserProfile, updateUserName, updateUserPassword, deleteAccount } from "@/lib/api/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, EyeOff, CheckCircle2, XCircle, User, Mail, Calendar, Clock, Edit2, Lock, Save, X, Trash2, Shield, Loader2 } from "lucide-react";
import moment from "moment";
import { logout } from "@/lib/api/auth";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sendEnablePinOtp, sendDisablePinOtp, verifyPinOtp, setSecurityPin, disableSecurityPin } from "@/lib/api/securityPin";
import { getState } from "@/lib/api/auth";
import { OtpVerification } from "@/components/otp-verification";
import { SecurityPin } from "@/components/security-pin";

const permissionsArray = {
  Notes: "notes",
  Tasks: "tasks",
  Images: "images",
  Games: "games",
  Messages: "messages",
  News: "news",
  Calendar: "calendar",
};

export default function ProfilePage() {
  const [location, setLocation] = useLocation();
  const { isLoggedIn, isPinSet, email, setPinSet, setPinVerified } = useSessionStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [showPinSetDialog, setShowPinSetDialog] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isDisablingPin, setIsDisablingPin] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [profile, setProfile] = useState({
    id: "",
    name: "",
    email: "",
    createdOn: "",
    lastLogIn: "",
    isActive: false,
  });

  const [updatedProfile, setUpdtProfile] = useState({
    name: "",
  });

  const [pass, setPass] = useState({
    password: "",
    cpassword: "",
  });

  const [permissions, setPermissions] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setLocation("/login");
      return;
    }
    fetchUserProfile();
  }, [isLoggedIn, setLocation]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await getUserProfile();
      if (response.status === 1 && response.user) {
        const user = response.user;
        setProfile({
          id: user._id,
          name: user.name,
          email: user.email,
          createdOn: user.date,
          lastLogIn: user.lastLogIn || "",
          isActive: user.isActive || false,
        });
        setUpdtProfile({ name: user.name });
        setPermissions(user.permissions || []);
        // Check pin status and update session store
        try {
          const state = await getState();
          if (state.status === 1) {
            setPinSet(state.data.isPinSet);
            setPinVerified(state.data.isPinVerified);
          }
        } catch (error) {
          console.error("Failed to get pin status:", error);
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Some error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpdtProfile({ ...updatedProfile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPass({ ...pass, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.name.trim() === updatedProfile.name.trim() || updatedProfile.name.trim().length < 5) {
      return;
    }

    setLoading(true);
    try {
      const response = await updateUserName(updatedProfile.name);
      if (response.success && response.user) {
        setProfile({ ...profile, name: response.user.name });
        setIsEditingName(false);
        toast({
          title: "Success",
          description: "Name updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating name:", error);
      toast({
        title: "Error",
        description: "Some error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelNameEdit = () => {
    setUpdtProfile({ name: profile.name });
    setIsEditingName(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.password !== pass.cpassword) {
      toast({
        title: "Error",
        description: "Password does not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await updateUserPassword(profile.id, profile.email, pass.password);
      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Password updated successfully",
        });
        setPass({ password: "", cpassword: "" });
        setIsEditingPassword(false);
      } else {
        toast({
          title: "Error",
          description: response.error || response.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: "Some error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPasswordEdit = () => {
    setPass({ password: "", cpassword: "" });
    setIsEditingPassword(false);
  };

  const isPasswordMatch = pass.cpassword !== "" && pass.password === pass.cpassword;
  const isPasswordMismatch = pass.cpassword !== "" && pass.password !== pass.cpassword;

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteAccount();
      if (response.success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been deleted successfully",
        });
        // Logout and redirect to login
        await logout();
        useSessionStore.getState().logout();
        setLocation("/login");
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Some error occurred while deleting account",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Security Pin Handlers
  const handleEnablePinClick = () => {
    setShowEnableDialog(true);
  };

  const handleEnablePinConfirm = async () => {
    setIsSendingOtp(true);
    try {
      await sendEnablePinOtp();
      setShowEnableDialog(false);
      setShowOtpDialog(true);
      toast({
        title: "OTP Sent",
        description: "OTP has been sent to your email",
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

  const handleDisablePinClick = () => {
    setShowDisableDialog(true);
  };

  const handleDisablePinConfirm = async () => {
    setIsSendingOtp(true);
    try {
      console.log("Sending disable pin OTP");
      await sendDisablePinOtp();
      console.log("OTP sent");
      setShowDisableDialog(false);
      setShowOtpDialog(true);
      toast({
        title: "OTP Sent",
        description: "OTP has been sent to your email",
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

  const handleOtpVerify = async (code: number) => {
    setIsVerifyingOtp(true);
    try {
      const action = isPinSet ? 'disable' : 'enable';
      const response = await verifyPinOtp(code.toString(), action);
      
      if (response.status === 1 && response.verified) {
        setIsVerifyingOtp(false);
        setShowOtpDialog(false);
        
        if (action === 'enable') {
          setShowPinSetDialog(true);
          toast({
            title: "OTP Verified",
            description: "Please set your security pin",
          });
        } else {
          // Disable pin
          setIsDisablingPin(true);
          try {
            await disableSecurityPin();
            
            toast({
              title: "Success",
              description: "Security pin disabled successfully",
            });
            
            // Get latest state from server and update session store
            try {
              const state = await getState();
              if (state.status === 1) {
                // Update session store with data from server
                setPinSet(state.data.isPinSet);
                setPinVerified(state.data.isPinVerified);
              }
            } catch (error) {
              console.error("Failed to refresh state:", error);
              // Fallback: update locally if server call fails
              setPinSet(false);
              setPinVerified(false);
            }
            
            // Refresh profile to get updated pin status
            await fetchUserProfile();
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to disable pin",
              variant: "destructive",
            });
          } finally {
            setIsDisablingPin(false);
          }
        }
      } else {
        setIsVerifyingOtp(false);
        toast({
          title: "Verification Failed",
          description: response.msg || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsVerifyingOtp(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to verify OTP",
        variant: "destructive",
      });
    }
  };

  const handleOtpResend = async () => {
    setIsSendingOtp(true);
    try {
      if (isPinSet) {
        await sendDisablePinOtp();
      } else {
        await sendEnablePinOtp();
      }
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
      setIsSendingOtp(false);
    }
  };

  const handlePinSetSuccess = async () => {
    setIsSettingPin(true);
    try {
      // Close the dialog first
      setShowPinSetDialog(false);
      
      toast({
        title: "Success",
        description: "Security pin enabled successfully. You can verify it when accessing protected data.",
      });
      
      // Get latest state from server and update session store
      try {
        const state = await getState();
        if (state.status === 1) {
          // Update session store with data from server
          setPinSet(state.data.isPinSet);
          setPinVerified(state.data.isPinVerified);
        }
      } catch (error) {
        console.error("Failed to refresh state:", error);
        // Fallback: update locally if server call fails
        setPinSet(true);
        setPinVerified(false);
      }
      
      // Refresh profile to get updated pin status
      await fetchUserProfile();
    } finally {
      setIsSettingPin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-3/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold font-serif mb-2">Profile</h1>
            <p className="text-muted-foreground text-lg">View and manage your account information</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading || isDeleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* User Information Card */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-serif flex items-center gap-2">
                  <User className="h-6 w-6" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <Label>Name</Label>
                    </div>
                    {isEditingName ? (
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <Input
                          name="name"
                          type="text"
                          value={updatedProfile.name}
                          onChange={handleNameChange}
                          required
                          disabled={loading}
                          minLength={5}
                          className="h-10"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              profile.name.trim() === updatedProfile.name.trim() ||
                              updatedProfile.name.trim().length < 5 ||
                              loading
                            }
                            className="flex-1"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleCancelNameEdit}
                            disabled={loading}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <p className="font-medium text-lg">{profile.name}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsEditingName(true)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <Label>Email</Label>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <Label>Account Created</Label>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">
                        {profile.createdOn ? moment(profile.createdOn).format("LLL") : "N/A"}
                      </p>
                    </div>
                  </div>

                  {profile.lastLogIn && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <Label>Last Login</Label>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium">
                          {moment(profile.lastLogIn).format("LLL")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <Label>Account Status</Label>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <Badge variant={profile.isActive ? "default" : "secondary"}>
                        {profile.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Pin Card */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Pin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Security Pin Protection</p>
                      <p className="text-sm text-muted-foreground">
                        {isPinSet
                          ? "Your account is protected with a security pin"
                          : "Enable security pin to protect your sensitive data"}
                      </p>
                    </div>
                    <Switch
                      checked={isPinSet}
                      onCheckedChange={(checked) => {
                        if (checked && !isPinSet) {
                          handleEnablePinClick();
                        } else if (!checked && isPinSet) {
                          handleDisablePinClick();
                        }
                      }}
                      disabled={loading || isSendingOtp || isVerifyingOtp || isSettingPin || isDisablingPin}
                    />
                  </div>
                  {isPinSet && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Security pin is active
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Password Update Card */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingPassword ? (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={pass.password}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                        disabled={loading}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpassword">Confirm Password</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="cpassword"
                          name="cpassword"
                          type={showPassword ? "text" : "password"}
                          value={pass.cpassword}
                          onChange={handlePasswordChange}
                          required
                          minLength={6}
                          disabled={loading}
                          placeholder="Re-enter password"
                          className={`flex-1 ${
                            isPasswordMismatch
                              ? "border-destructive border-2"
                              : isPasswordMatch
                              ? "border-green-500 border-2"
                              : ""
                          }`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-10 w-10"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {isPasswordMismatch && (
                        <p className="text-sm text-destructive">Passwords do not match</p>
                      )}
                      {isPasswordMatch && (
                        <p className="text-sm text-green-600">Passwords match</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={loading || !isPasswordMatch || pass.password.length < 6}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Update Password
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelPasswordEdit}
                        disabled={loading}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Your password is encrypted and secure
                      </p>
                      <p className="text-muted-foreground">••••••••</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingPassword(true)}
                      className="w-full"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Permissions Sidebar */}
          <div className="lg:col-span-1">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl">Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.keys(permissionsArray).map((key) => {
                    const isEnabled = permissions.includes(
                      permissionsArray[key as keyof typeof permissionsArray]
                    );
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium">{key}</span>
                        <div className="flex items-center gap-2">
                          {isEnabled ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <span className="text-sm text-green-600">Enabled</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-destructive" />
                              <span className="text-sm text-muted-foreground">Disabled</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enable Security Pin Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={(open) => {
        if (!open && !isSendingOtp) {
          setShowEnableDialog(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Security Pin</DialogTitle>
            <DialogDescription>
              {isSendingOtp ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending OTP to your email...</span>
                </div>
              ) : (
                <>
                  Security pin adds an extra layer of protection to your account. You will be asked to enter your pin when accessing sensitive data.
                  <br /><br />
                  To enable, we will send an OTP to your email for verification. After verification, you will be asked to set a 6-digit security pin.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnableDialog(false)} disabled={isSendingOtp}>
              Cancel
            </Button>
            <Button onClick={handleEnablePinConfirm} disabled={isSendingOtp}>
              {isSendingOtp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Security Pin Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={(open) => {
        if (!open && !isSendingOtp) {
          setShowDisableDialog(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Security Pin?</AlertDialogTitle>
            <AlertDialogDescription>
              {isSendingOtp ? (
                <div className="flex items-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="font-medium">Sending OTP to your email...</span>
                </div>
              ) : (
                <>
                  Are you sure you want to disable security pin? This will remove the extra layer of protection from your account.
                  <br /><br />
                  You will need to verify your email with an OTP to proceed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingOtp}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleDisablePinConfirm}
              disabled={isSendingOtp}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSendingOtp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={(open) => {
        // Only allow closing if not verifying, disabling, or sending OTP
        // This prevents closing on outside click or escape key during operations
        if (!open && !isVerifyingOtp && !isDisablingPin && !isSendingOtp) {
          setShowOtpDialog(false);
        }
      }}>
        <DialogContent 
          onInteractOutside={(e) => {
            // Prevent closing on outside click
            e.preventDefault();
          }} 
          onEscapeKeyDown={(e) => {
            // Prevent closing on Escape key if verifying, disabling, or sending
            if (isVerifyingOtp || isDisablingPin || isSendingOtp) {
              e.preventDefault();
            }
          }}
          className={isVerifyingOtp || isDisablingPin || isSendingOtp ? "[&>button]:hidden" : ""}
        >
          <DialogHeader>
            <DialogTitle>Verify Email</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to your email
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 w-full max-w-full overflow-visible min-[350px]:overflow-hidden">
            <OtpVerification
              onVerify={handleOtpVerify}
              onResend={handleOtpResend}
              isLoading={isVerifyingOtp || isDisablingPin}
              message={isPinSet ? "Enter OTP to disable security pin" : "Enter OTP to enable security pin"}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!isVerifyingOtp && !isDisablingPin && !isSendingOtp) {
                  setShowOtpDialog(false);
                }
              }}
              disabled={isVerifyingOtp || isDisablingPin || isSendingOtp}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Pin Dialog */}
      <Dialog open={showPinSetDialog} onOpenChange={(open) => {
        // Only allow closing if not currently setting pin
        if (!open && !isSettingPin) {
          setShowPinSetDialog(false);
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Security Pin</DialogTitle>
            <DialogDescription>
              Enter a 6-digit security pin to protect your account
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SecurityPin
              mode="set"
              inline={true}
              onSuccess={handlePinSetSuccess}
              onCancel={() => {
                if (!isSettingPin) {
                  setShowPinSetDialog(false);
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers. You will be logged out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Yes, delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

