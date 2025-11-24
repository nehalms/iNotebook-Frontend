import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionStore } from "@/store/sessionStore";
import { getUserProfile, updateUserName, updateUserPassword } from "@/lib/api/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2, XCircle, User, Mail, Calendar, Clock, Edit2, Lock, Save, X } from "lucide-react";
import moment from "moment";

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
  const { isLoggedIn } = useSessionStore();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-3/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold font-serif mb-2">Profile</h1>
          <p className="text-muted-foreground text-lg">View and manage your account information</p>
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
    </div>
  );
}

