"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { useCommunityComments, useCreateCommunityComment } from "@/hooks/queries/use-community";
import { SpoilerContent } from "@/components/reviews/spoiler-content";
import { toast } from "sonner";

type CommunityCommentsProps = {
  targetType: "REVIEW" | "POST";
  targetId: string;
};

export function CommunityComments({ targetType, targetId }: CommunityCommentsProps) {
  const t = useTranslations("community");
  const { isAuthenticated } = useAuth();
  const { data, refetch } = useCommunityComments(targetType, targetId);
  const create = useCreateCommunityComment();
  const [content, setContent] = useState("");
  const [hasSpoiler, setHasSpoiler] = useState(false);

  const comments = data?.data ?? [];

  async function submit() {
    if (content.trim().length < 1) return;
    if (!isAuthenticated) {
      toast.message(t("loginToInteract"));
      return;
    }
    try {
      await create.mutateAsync({ targetType, targetId, content: content.trim(), hasSpoiler });
      setContent("");
      setHasSpoiler(false);
      refetch();
    } catch {
      toast.error(t("commentError"));
    }
  }

  return (
    <div className="mt-4 border-t border-border/30 pt-3">
      <p className="text-muted-foreground mb-2 text-xs font-medium">{t("comments")}</p>
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="text-sm">
            <p className="text-muted-foreground text-xs">
              <span className="text-foreground font-medium">{c.userName}</span>
              {" · "}
              <time dateTime={c.createdAt}>{new Date(c.createdAt).toLocaleDateString()}</time>
            </p>
            <SpoilerContent hasSpoiler={c.hasSpoiler}>
              <p className="mt-0.5 leading-relaxed">{c.content}</p>
            </SpoilerContent>
          </li>
        ))}
      </ul>
      {isAuthenticated ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("commentPlaceholder")}
            rows={2}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id={`spoiler-${targetId}`}
              checked={hasSpoiler}
              onCheckedChange={(v) => setHasSpoiler(v === true)}
            />
            <Label htmlFor={`spoiler-${targetId}`} className="text-xs">
              {t("markSpoiler")}
            </Label>
          </div>
          <Button type="button" size="sm" onClick={submit} disabled={create.isPending}>
            {t("commentSubmit")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
