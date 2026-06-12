"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RemoteImage } from "@/components/shared/remote-image";
import { REVIEW_EMOTION_TAG_KEYS } from "@/lib/review-emotion-tags";
import { useUploadReviewImage } from "@/hooks/queries/use-community";
import type { CreateReviewInput } from "@/lib/schemas/movie";
import { ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";

const MAX_IMAGES = 3;

type RichReviewFormProps = {
  onSubmit: (payload: CreateReviewInput) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function RichReviewForm({ onSubmit, isSubmitting, submitLabel }: RichReviewFormProps) {
  const t = useTranslations("community");
  const tMovies = useTranslations("movies");
  const upload = useUploadReviewImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [rating, setRating] = useState(8);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [uploading, setUploading] = useState(false);

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (imageUrls.length >= MAX_IMAGES) {
      toast.message(t("reviewImageLimit", { max: MAX_IMAGES }));
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await upload.mutateAsync(fd);
      const url = res.data?.url;
      if (url) setImageUrls((prev) => [...prev, url]);
    } catch {
      toast.error(t("reviewImageUploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (content.trim().length < 10) return;
    await onSubmit({
      title: title.trim() || undefined,
      rating,
      content: content.trim(),
      tags: tags.length ? tags : undefined,
      imageUrls: imageUrls.length ? imageUrls : undefined,
      hasSpoiler: hasSpoiler || undefined,
    });
    setTitle("");
    setContent("");
    setTags([]);
    setImageUrls([]);
    setHasSpoiler(false);
    setRating(8);
  }

  return (
    <div className="space-y-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("reviewTitlePlaceholder")}
        maxLength={120}
      />

      <div className="flex flex-wrap gap-2">
        {REVIEW_EMOTION_TAG_KEYS.map((tag) => (
          <Button
            key={tag}
            type="button"
            size="sm"
            variant={tags.includes(tag) ? "default" : "outline"}
            className="h-8 rounded-full px-3 text-xs"
            onClick={() => toggleTag(tag)}
          >
            {t(`emotionTag_${tag}`)}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">{tMovies("rating")}:</label>
        <Select value={String(rating)} onValueChange={(v) => setRating(Number(v))}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}/10
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={tMovies("reviewBodyPlaceholder")}
        rows={5}
      />

      {imageUrls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md bg-muted">
              <RemoteImage src={url} alt="" fill className="object-cover" sizes="80px" />
              <button
                type="button"
                className="bg-background/80 absolute right-0.5 top-0.5 rounded-full p-0.5"
                onClick={() => setImageUrls((prev) => prev.filter((u) => u !== url))}
                aria-label={t("removeImage")}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImagePick}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || imageUrls.length >= MAX_IMAGES}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="mr-1.5 h-4 w-4" />
          )}
          {t("addReviewImage", { count: imageUrls.length, max: MAX_IMAGES })}
        </Button>
        <div className="flex items-center gap-2">
          <Checkbox
            id="review-spoiler"
            checked={hasSpoiler}
            onCheckedChange={(v) => setHasSpoiler(v === true)}
          />
          <Label htmlFor="review-spoiler" className="text-xs">
            {t("markSpoiler")}
          </Label>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || content.trim().length < 10}
      >
        <Send className="mr-2 h-4 w-4" />
        {isSubmitting ? tMovies("submittingReview") : (submitLabel ?? tMovies("writeReview"))}
      </Button>
    </div>
  );
}
