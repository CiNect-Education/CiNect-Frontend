"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  Crown,
  Mail,
  MapPin,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";
import { useUpdateProfile } from "@/hooks/queries/use-auth";
import { useMembershipProfile } from "@/hooks/queries/use-membership";
import { Link } from "@/i18n/navigation";
import { PROFILE_GENDER_VALUES, profileFormSchema, type ProfileFormValues } from "@/lib/schemas/profile";

const CITY_SUGGESTIONS = [
  "Ho Chi Minh City",
  "Ha Noi",
  "Da Nang",
  "Can Tho",
  "Hai Phong",
  "Nha Trang",
  "Hue",
  "Bien Hoa",
];

const GENDER_NONE = "__none__";

export default function ProfilePage() {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { user, refetchUser } = useAuth();
  const { data: membershipRes } = useMembershipProfile();
  const updateProfile = useUpdateProfile();
  const membershipProfile = membershipRes?.data;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      phone: "",
      avatar: "",
      dateOfBirth: "",
      gender: "",
      city: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    form.reset({
      fullName: user.fullName ?? "",
      phone: user.phone ?? "",
      avatar: user.avatar ?? "",
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
      gender: PROFILE_GENDER_VALUES.includes((user.gender as (typeof PROFILE_GENDER_VALUES)[number]) ?? "")
        ? ((user.gender as (typeof PROFILE_GENDER_VALUES)[number]) ?? "")
        : "",
      city: user.city ?? "",
    });
  }, [form, user]);

  const values = form.watch();

  const completionItems = [
    { key: "fullName", label: t("completionName"), complete: values.fullName.trim().length >= 2 },
    { key: "phone", label: t("completionPhone"), complete: values.phone.trim().length > 0 },
    { key: "avatar", label: t("completionAvatar"), complete: values.avatar.trim().length > 0 },
    { key: "dateOfBirth", label: t("completionBirthday"), complete: values.dateOfBirth.length > 0 },
    { key: "city", label: t("completionCity"), complete: values.city.trim().length > 0 },
  ];
  const completedCount = completionItems.filter((item) => item.complete).length;
  const completionPercent = Math.round((completedCount / completionItems.length) * 100);

  const initials =
    user?.fullName
      ?.split(" ")
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "CN";

  const avatarPreview = values.avatar.trim();

  const applyServerErrors = (details: unknown) => {
    if (!details || typeof details !== "object") return;

    for (const [field, message] of Object.entries(details as Record<string, unknown>)) {
      const normalizedField = field.split(".").pop();
      if (!normalizedField) continue;
      if (!(normalizedField in form.getValues())) continue;

      form.setError(normalizedField as keyof ProfileFormValues, {
        type: "server",
        message: Array.isArray(message) ? String(message[0]) : String(message),
      });
    }
  };

  const handleSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(
      {
        fullName: data.fullName.trim(),
        phone: data.phone.trim() || undefined,
        avatar: data.avatar.trim() || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender || undefined,
        city: data.city.trim() || undefined,
      },
      {
        onSuccess: () => {
          void refetchUser();
          form.reset({
            fullName: data.fullName.trim(),
            phone: data.phone.trim(),
            avatar: data.avatar.trim(),
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            city: data.city.trim(),
          });
        },
        onError: (error) => {
          applyServerErrors(error.details);
        },
      }
    );
  };

  return (
    <div>
      <PageHeader
        title={t("profile")}
        description={t("profileDesc")}
        breadcrumbs={[{ label: t("title"), href: "/account/profile" }, { label: t("profile") }]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <div className="space-y-6">
          <Card className="cinect-glass border overflow-hidden">
            <div className="from-primary/10 via-background to-background bg-gradient-to-r">
              <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                    {avatarPreview && <AvatarImage src={avatarPreview} alt={values.fullName || initials} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 rounded-full p-2 shadow">
                    <Camera className="h-4 w-4" />
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="text-muted-foreground text-sm">{t("overviewCardTitle")}</p>
                    <h2 className="truncate text-2xl font-semibold">{values.fullName || user?.fullName || initials}</h2>
                    <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        {user?.email}
                      </span>
                      {values.city ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {values.city}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={user?.emailVerified ? "default" : "secondary"}>
                      <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                      {user?.emailVerified ? t("verifiedEmail") : t("unverifiedEmail")}
                    </Badge>
                    <Badge variant={user?.isActive === false ? "secondary" : "outline"}>
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                      {user?.isActive === false ? t("inactiveStatus") : t("activeStatus")}
                    </Badge>
                    <Badge variant="outline">
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      {values.dateOfBirth ? t("birthdayPerkReady") : t("birthdayPerkMissing")}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("profileCompletion")}</span>
                      <span className="font-medium">{completionPercent}%</span>
                    </div>
                    <Progress value={completionPercent} className="h-2.5" />
                    <p className="text-muted-foreground text-xs">
                      {t("completionHelp", { complete: completedCount, total: completionItems.length })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>

          <Card className="cinect-glass border">
            <CardHeader>
              <CardTitle className="text-lg">{t("personalInfoCardTitle")}</CardTitle>
              <CardDescription>{t("profileDetailsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit, () => toast.error(t("profileValidationToast")))}
                  className="space-y-6"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>{tAuth("fullName")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("fullNamePlaceholder")} {...field} />
                          </FormControl>
                          <FormDescription>{t("overviewCardDesc")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem className="sm:col-span-2">
                      <FormLabel>{tAuth("email")}</FormLabel>
                      <Input type="email" value={user?.email ?? ""} disabled />
                      <FormDescription>{t("emailReadonlyHint")}</FormDescription>
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tAuth("phone")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("phonePrefixPlaceholder")} inputMode="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("dateOfBirth")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("labelGender")}</FormLabel>
                          <Select
                            value={field.value || GENDER_NONE}
                            onValueChange={(value) => field.onChange(value === GENDER_NONE ? "" : value)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("genderSelectPlaceholder")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={GENDER_NONE}>{t("genderSelectPlaceholder")}</SelectItem>
                              <SelectItem value="MALE">{t("genderMale")}</SelectItem>
                              <SelectItem value="FEMALE">{t("genderFemale")}</SelectItem>
                              <SelectItem value="OTHER">{t("genderOther")}</SelectItem>
                              <SelectItem value="PREFER_NOT_TO_SAY">{t("genderPreferNotToSay")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("labelCity")}</FormLabel>
                          <FormControl>
                            <Input list="profile-city-suggestions" placeholder={t("cityPlaceholder")} {...field} />
                          </FormControl>
                          <FormDescription>{t("citySuggestionsHint")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="avatar"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>{t("avatarUrlLabel")}</FormLabel>
                          <FormControl>
                            <Input id="avatarUrl" placeholder={t("avatarUrlPlaceholder")} {...field} />
                          </FormControl>
                          <FormDescription>{t("avatarPasteUrlHint")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <datalist id="profile-city-suggestions">
                    {CITY_SUGGESTIONS.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>

                  <Separator />

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-muted-foreground text-sm">
                      {form.formState.isDirty ? t("unsavedChangesHint") : t("savedStateHint")}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!form.formState.isDirty || updateProfile.isPending}
                        onClick={() => form.reset()}
                      >
                        {t("resetProfileCta")}
                      </Button>
                      <Button type="submit" disabled={updateProfile.isPending || !form.formState.isDirty}>
                        <Save className="mr-2 h-4 w-4" />
                        {updateProfile.isPending ? tCommon("saving") : tCommon("save")}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="cinect-glass border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5" />
                {t("membershipSnapshotTitle")}
              </CardTitle>
              <CardDescription>{t("membershipSnapshotDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-sm">{t("membershipTierLabel")}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <UserRound className="text-primary h-4 w-4" />
                    <span className="text-lg font-semibold">
                      {membershipProfile?.tier?.name ?? user?.membershipTier ?? t("membershipTierFallback")}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-muted-foreground text-sm">{t("membershipPointsLabel")}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Sparkles className="text-primary h-4 w-4" />
                    <span className="text-lg font-semibold">
                      {(membershipProfile?.currentPoints ?? user?.membershipPoints ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/account/membership">{t("manageMembership")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="cinect-glass border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5" />
                {t("profileChecklistTitle")}
              </CardTitle>
              <CardDescription>{t("profileChecklistDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {completionItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm">{item.label}</span>
                  <Badge variant={item.complete ? "default" : "secondary"}>
                    {item.complete ? t("completionDone") : t("completionPending")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
