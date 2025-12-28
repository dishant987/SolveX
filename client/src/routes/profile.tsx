import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/typed-query";
import { createFileRoute, useNavigate, } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/FormField";
import { useToast } from "@/hooks/use-toast";
import type { ProfileResponse } from "@/types/types";
import { useAuth } from "@/hooks/useAuth";
import { profileSchema, type ProfileFormData } from "@/lib/validations";
import { publicApi } from "@/lib/public-api";
import { LogOut, Camera, Upload } from "lucide-react";
import { LogoutDialog } from "@/components/LogoutDialog";
import { useApiMutation } from "@/lib/typed-mutation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)

  const [isHovering, setIsHovering] = useState(false)
  const { isAuthenticated, logout, setUser, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  const uploadProfileImage = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const res = await api.patch("/auth/profile/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })

    return res.data
  }


  const {
    data: users,
    isLoading,
    error,
  } = useApiQuery<ProfileResponse>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get("/auth/profile");
      return res.data;
    },
  });

  const imageMutation = useApiMutation({
    mutationFn: uploadProfileImage,

    onSuccess: (data) => {
      console.log(data);
      toast({
        title: "Profile image updated",
        description: "Your profile photo has been updated successfully.",
      })

      setImagePreview(data.imageUrl)
      if (!user) return

      setUser((prev) => {
        if (!prev) return null

        return {
          ...prev,
          imageUrl: data.imageUrl,
        }
      })
    },

    onError: (error) => {
      console.log(error);
      const apiError = error.response?.data
      toast({
        variant: "destructive",
        title: "Image upload failed",
        description: apiError?.message ?? "Something went wrong",
      })
      setImagePreview(null)
    },
  })


  const handleLogout = async () => {
    if (isLoggingOut) return

    try {
      setIsLoggingOut(true)

      await publicApi.post("/auth/logout")
      logout()

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })

      navigate({ to: "/login" })
    } finally {
      setIsLoggingOut(false)
      setLogoutOpen(false)
    }
  }

  const handleCameraIconClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the avatar click
    const imageUrl = imagePreview || users?.data.user.imageUrl;
    if (imageUrl) {
      setImageModalOpen(true);
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate client-side
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload an image file.",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be under 5MB.",
      })
      return
    }

    // Preview instantly
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)

    // Upload
    imageMutation.mutate(file, {
      onSettled: () => {
        // Clean up the object URL
        URL.revokeObjectURL(previewUrl)
      }
    })
  }

  const handleAvatarClick = () => {
    if (!imageMutation.isPending) {
      fileInputRef.current?.click()
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: users
      ? {
        firstName: users.data.user.firstName ?? "",
        lastName: users.data.user.lastName ?? "",
        email: users.data.user.email ?? "",
      }
      : undefined,
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);

    await api.put("/auth/profile", data);

    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });

    setSaving(false);
    reset(data);
  };

  /* ---------------- LOADING ---------------- */

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* LEFT – PROFILE CARD */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            {/* AVATAR WITH HOVER EFFECT */}
            <div
              className="relative group"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div
                className="relative cursor-pointer"
                onClick={handleAvatarClick}
              >
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg group-hover:border-primary/30 transition-all duration-300">
                  {imageMutation.isPending ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">Uploading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <AvatarImage
                        src={imagePreview || users?.data.user.imageUrl || ""}
                        className="group-hover:brightness-75 transition-all duration-300"
                      />
                      <AvatarFallback className="text-2xl group-hover:brightness-75 transition-all duration-300">
                        {users?.data.user.firstName?.charAt(0)}
                        {users?.data.user.lastName?.charAt(0)}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

                {/* CAMERA OVERLAY EFFECT */}
                <div className={`
                  absolute inset-0 flex flex-col items-center justify-center 
                  rounded-full bg-black/60 text-white opacity-0 
                  group-hover:opacity-100 transition-all duration-300
                  ${imageMutation.isPending ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}>
                  {imageMutation.isPending ? (
                    <>
                      <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2" />
                      <span className="text-sm font-medium">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">
                        {users?.data.user.imageUrl || imagePreview ? 'Change Photo' : 'Upload Photo'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* CAMERA ICON BADGE */}
              <div
                className={`
      absolute -bottom-2 -right-2 h-10 w-10 rounded-full 
      bg-primary text-primary-foreground flex items-center justify-center 
      shadow-lg border-4 border-background
      transition-all duration-300
      ${isHovering ? 'scale-110 rotate-12' : 'scale-100'}
      ${(users?.data.user.imageUrl || imagePreview) ? 'cursor-pointer hover:bg-primary/90' : 'cursor-default'}
    `}
                onClick={handleCameraIconClick}
                title="View profile photo"
              >
                {imageMutation.isPending ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </div>

              {/* HIDDEN FILE INPUT */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onImageChange}
                disabled={imageMutation.isPending}
              />
            </div>

            {/* USER INFO */}
            <div className="text-center mt-4">
              <p className="font-semibold text-lg">
                {users?.data.user.firstName} {users?.data.user.lastName}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{users?.data.user.email}</p>
            </div>

            {/* PROVIDER BADGES */}
            <div className="flex flex-wrap gap-2 justify-center">
              {users?.data.user.accounts.map((acc) => (
                <Badge key={acc.provider} variant="secondary">
                  {acc.provider === "GOOGLE" ? "Google" : "Local"}
                </Badge>
              ))}
            </div>

            {/* UPLOAD BUTTON FOR MOBILE */}
            <Button
              variant="outline"
              size="sm"
              className="mt-2 cursor-pointer sm:hidden"
              onClick={handleAvatarClick}
              disabled={imageMutation.isPending}
            >
              {imageMutation.isPending ? (
                <>
                  <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Change Photo
                </>
              )}
            </Button>

            {/* LOGOUT BUTTON */}
            <Button
              variant="destructive"
              className="w-full mt-6 cursor-pointer"
              onClick={() => setLogoutOpen(true)}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>

          </CardContent>
        </Card>

        {/* RIGHT – FORM */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label="First Name"
                  htmlFor="firstName"
                  error={errors.firstName?.message}
                  required
                >
                  <Input
                    {...register("firstName")}
                    placeholder="First name"
                    error={!!errors.firstName}
                  />
                </FormField>

                <FormField
                  label="Last Name"
                  htmlFor="lastName"
                  error={errors.lastName?.message}
                  required
                >
                  <Input
                    {...register("lastName")}
                    placeholder="Last name"
                    error={!!errors.lastName}
                  />
                </FormField>
              </div>

              <FormField
                label="Email"
                htmlFor="email"
                error={errors.email?.message}
                required
              >
                <Input
                  disabled
                  {...register("email")}
                  placeholder="Email"
                  error={!!errors.email}
                />
              </FormField>

              {/* PROVIDER INFO */}
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium mb-2">
                  Authentication Providers
                </p>
                <div className="flex gap-2 flex-wrap">
                  {users?.data.user.accounts.map((acc) => (
                    <Badge key={acc.provider} variant="outline">
                      {acc.provider === "GOOGLE"
                        ? "Google OAuth"
                        : "Email & Password"}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={!isDirty || saving}
                className="w-full sm:w-auto"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <LogoutDialog
        open={logoutOpen}
        onOpenChange={!isLoggingOut ? setLogoutOpen : () => { }}
        onConfirm={handleLogout}
        loading={isLoggingOut}
      />
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img
                src={imagePreview || users?.data.user.imageUrl || ""}
                alt="Profile photo"
                className="max-h-[60vh] max-w-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${users?.data.user.firstName}+${users?.data.user.lastName}&background=random`;
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageMutation.isPending}
            >
              {imageMutation.isPending ? (
                <>
                  <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Change Photo
                </>
              )}
            </Button>
            <Button onClick={() => setImageModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- SKELETON ---------------- */

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <Skeleton className="h-[320px] w-full rounded-xl" />
        <Skeleton className="h-[420px] w-full rounded-xl md:col-span-2" />
      </div>
    </div>
  );
}