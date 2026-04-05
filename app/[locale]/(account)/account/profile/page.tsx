"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useUpdateProfile } from "@/hooks/queries/use-auth";

export default function ProfilePage() {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tAdmin = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { user, refetchUser } = useAuth();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? "");
    setPhone(user.phone ?? "");
    setAvatarUrl(user.avatar ?? "");
    setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "");
    setGender(user.gender ?? "");
    setCity(user.city ?? "");
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        fullName: fullName || undefined,
        phone: phone || undefined,
        avatar: avatarUrl || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        city: city || undefined,
      },
      {
        onSuccess: () => {
          void refetchUser();
        },
      }
    );
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "CN";

  return (
    <div>
      <PageHeader
        title={t("profile")}
        description={t("profileDesc")}
        breadcrumbs={[{ label: t("title"), href: "/account/profile" }, { label: t("profile") }]}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Avatar Section */}
        <Card className="cinect-glass border">
          <CardHeader>
            <CardTitle className="text-lg">{t("avatarCardTitle")}</CardTitle>
            <CardDescription>{t("profileAvatarDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || initials} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full"
                  onClick={() => {
                    const el = document.getElementById("avatarUrl");
                    if (el) el.focus();
                  }}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span className="sr-only">{t("changeAvatarSr")}</span>
                </Button>
              </div>
              <div className="flex-1 space-y-2 text-sm">
                <p className="text-muted-foreground">{t("avatarPasteUrlHint")}</p>
                <div className="space-y-1">
                  <Label htmlFor="avatarUrl">{t("avatarUrlLabel")}</Label>
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder={t("avatarUrlPlaceholder")}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="cinect-glass border">
          <CardHeader>
            <CardTitle className="text-lg">{t("personalInfoCardTitle")}</CardTitle>
            <CardDescription>{t("profileDetailsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">{tAuth("fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("fullNamePlaceholder")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">{tAuth("email")}</Label>
                <Input id="email" type="email" value={user?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{tAuth("phone")}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phonePrefixPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">{t("dateOfBirth")}</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">{t("labelGender")}</Label>
                <Input
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder={t("genderPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t("labelCity")}</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("cityPlaceholder")}
                />
              </div>
            </div>
            <Separator className="my-6" />
            <Button type="submit" disabled={updateProfile.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateProfile.isPending ? tCommon("saving") : tAdmin("saveChanges")}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
