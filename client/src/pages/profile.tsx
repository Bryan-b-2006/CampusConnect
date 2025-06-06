import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Edit, Save, X, Shield, Mail, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NavigationHeader } from "@/components/navigation-header";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'club_head':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'club_member':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'registrar':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'financial_head':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      await updateUser(data);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully!",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsUpdating(true);
    try {
      await updateUser({ password: data.newPassword });
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully!",
      });
      setIsChangingPassword(false);
      passwordForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    profileForm.reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      <NavigationHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Profile Settings</h1>
          <p className="text-neutral-600 dark:text-gray-300 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-neutral-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-neutral-600 dark:text-gray-300" />
                </div>
                
                <h3 className="text-xl font-semibold text-neutral-800 dark:text-white mb-2">
                  {user.firstName} {user.lastName}
                </h3>
                
                <Badge className={`mb-4 ${getRoleBadgeColor(user.role)}`}>
                  {formatRole(user.role)}
                </Badge>
                
                <div className="space-y-3 text-left">
                  <div className="flex items-center space-x-3 text-sm text-neutral-600 dark:text-gray-300">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-neutral-600 dark:text-gray-300">
                    <User className="w-4 h-4" />
                    <span>@{user.username}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-neutral-600 dark:text-gray-300">
                    <Shield className="w-4 h-4" />
                    <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>

                {user.bio && (
                  <div className="mt-4 p-3 bg-neutral-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-neutral-700 dark:text-gray-300">
                      {user.bio}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={profileForm.handleSubmit(onProfileSubmit)}
                        disabled={isUpdating}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isUpdating ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...profileForm.register("firstName")}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                      {profileForm.formState.errors.firstName && (
                        <p className="mt-1 text-sm text-error">
                          {profileForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...profileForm.register("lastName")}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                      {profileForm.formState.errors.lastName && (
                        <p className="mt-1 text-sm text-error">
                          {profileForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      {...profileForm.register("username")}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                    {profileForm.formState.errors.username && (
                      <p className="mt-1 text-sm text-error">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register("email")}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                    {profileForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-error">
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...profileForm.register("bio")}
                      disabled={!isEditing}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="mt-1"
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="mt-1 text-sm text-error">
                        {profileForm.formState.errors.bio.message}
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Change Password</CardTitle>
                  {!isChangingPassword ? (
                    <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                      <Shield className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsChangingPassword(false);
                        passwordForm.reset();
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isChangingPassword ? (
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Choose a strong password with at least 6 characters.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register("currentPassword")}
                        className="mt-1"
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="mt-1 text-sm text-error">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register("newPassword")}
                        className="mt-1"
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="mt-1 text-sm text-error">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register("confirmPassword")}
                        className="mt-1"
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="mt-1 text-sm text-error">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" disabled={isUpdating} className="w-full">
                      {isUpdating ? "Changing Password..." : "Change Password"}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 dark:text-gray-300">
                      Your password is secure. Click the button above to change it.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-neutral-200 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-white">Account Status</p>
                      <p className="text-sm text-neutral-600 dark:text-gray-300">Your account is active</p>
                    </div>
                    <Badge className="bg-success/10 text-success">Active</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b border-neutral-200 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-white">Role</p>
                      <p className="text-sm text-neutral-600 dark:text-gray-300">
                        Your current role in the system
                      </p>
                    </div>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {formatRole(user.role)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-white">Member Since</p>
                      <p className="text-sm text-neutral-600 dark:text-gray-300">
                        You joined CampusConnect
                      </p>
                    </div>
                    <div className="flex items-center text-neutral-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">2024</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
