import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionStore } from "@/store/sessionStore";
import { getUserProfile, updateUserName, updateUserPassword } from "@/lib/api/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
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

  const isPasswordMatch = pass.cpassword !== "" && pass.password === pass.cpassword;
  const isPasswordMismatch = pass.cpassword !== "" && pass.password !== pass.cpassword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-chart-3/10 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold font-serif mb-2">Profile</h1>
          <p className="text-muted-foreground text-lg">Manage your account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={updatedProfile.name}
                        onChange={handleNameChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="createdOn">Account Created On</Label>
                      <Input
                        id="createdOn"
                        type="text"
                        value={profile.createdOn ? moment(profile.createdOn).format("LLL") : ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      disabled={
                        profile.name.trim() === updatedProfile.name.trim() ||
                        updatedProfile.name.trim().length < 5 ||
                        loading
                      }
                      className="min-w-[50%]"
                    >
                      Update Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl">Update Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpassword">Re-enter Password</Label>
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
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button type="submit" disabled={loading} className="min-w-[50%]">
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="text-xl">Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Feature</th>
                        <th className="text-left py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(permissionsArray).map((key) => {
                        const isEnabled = permissions.includes(
                          permissionsArray[key as keyof typeof permissionsArray]
                        );
                        return (
                          <tr key={key} className="border-b">
                            <td className="py-2 px-2">{key}</td>
                            <td className="py-2 px-2">
                              <div className="flex items-center gap-2">
                                {isEnabled ? (
                                  <>
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="text-sm">Enabled</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-5 w-5 text-destructive" />
                                    <span className="text-sm">Disabled</span>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

