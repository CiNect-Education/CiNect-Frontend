"use client";

import { useRef, type RefObject } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FieldHintTooltip } from "@/components/shared/field-hint-tooltip";
import { useUploadAvatar } from "@/hooks/queries/use-auth";
import { ApiError } from "@/lib/api-client";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  fileInputRef?: RefObject<HTMLInputElement | null>;
};

export function ProfileAvatarField({ value, onChange, onBlur, fileInputRef }: Props) {
  const t = useTranslations("account");
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = fileInputRef ?? internalRef;
  const uploadAvatar = useUploadAvatar();

  const validateFile = (file: File): boolean => {
    if (!AVATAR_ACCEPT.split(",").includes(file.type)) {
      toast.error(t("avatarInvalidType"));
      return false;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error(t("avatarTooLarge"));
      return false;
    }
    return true;
  };

  const handleFileChange = (file: File | null | undefined) => {
    if (!file || !validateFile(file)) return;

    uploadAvatar.mutate(file, {
      onSuccess: (res) => {
        onChange(res.data.url);
        toast.success(t("avatarUploadSuccess"));
      },
      onError: (error) => {
        const message = error instanceof ApiError ? error.toastMessage : t("avatarUploadFailed");
        toast.error(message);
      },
    });
  };

  return (
    <FormItem className="sm:col-span-2">
      <div className="flex items-center gap-1.5">
        <FormLabel>{t("avatarUrlLabel")}</FormLabel>
        <FieldHintTooltip hint={t("avatarPasteUrlHint")} srLabel={t("fieldHintSr")} />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_ACCEPT}
        className="hidden"
        disabled={uploadAvatar.isPending}
        onChange={(event) => {
          handleFileChange(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <FormControl>
        <Input
          id="avatarUrl"
          placeholder={t("avatarUrlPlaceholder")}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
      </FormControl>

      <FormMessage />
    </FormItem>
  );
}

export const profileAvatarAccept = AVATAR_ACCEPT;
export const profileAvatarMaxBytes = AVATAR_MAX_BYTES;
