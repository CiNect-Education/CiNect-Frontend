"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCreateCommunityPost } from "@/hooks/queries/use-community";
import { Plus, MessageSquare, BarChart3 } from "lucide-react";
import { toast } from "sonner";

type CommunityCreateDialogProps = {
  onCreated?: () => void;
};

export function CommunityCreateDialog({ onCreated }: CommunityCreateDialogProps) {
  const t = useTranslations("community");
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const createPost = useCreateCommunityPost();

  function reset() {
    setContent("");
    setHasSpoiler(false);
    setPollOptions(["", ""]);
  }

  async function submitDiscussion() {
    if (content.trim().length < 3) return;
    try {
      await createPost.mutateAsync({
        content: content.trim(),
        type: "DISCUSSION",
        hasSpoiler: hasSpoiler || undefined,
      });
      toast.success(t("postCreated"));
      setOpen(false);
      reset();
      onCreated?.();
    } catch {
      toast.error(t("postError"));
    }
  }

  async function submitPoll() {
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (content.trim().length < 3 || options.length < 2) return;
    try {
      await createPost.mutateAsync({
        content: content.trim(),
        type: "POLL",
        pollOptions: options,
        hasSpoiler: hasSpoiler || undefined,
      });
      toast.success(t("pollCreated"));
      setOpen(false);
      reset();
      onCreated?.();
    } catch {
      toast.error(t("postError"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" />
          {t("createPost")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createTitle")}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="discussion" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discussion" className="gap-1 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              {t("tabDiscussions")}
            </TabsTrigger>
            <TabsTrigger value="poll" className="gap-1 text-xs">
              <BarChart3 className="h-3.5 w-3.5" />
              {t("tabPolls")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussion" className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("discussionPlaceholder")}
              rows={4}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="post-spoiler"
                checked={hasSpoiler}
                onCheckedChange={(v) => setHasSpoiler(v === true)}
              />
              <Label htmlFor="post-spoiler" className="text-xs">
                {t("markSpoiler")}
              </Label>
            </div>
            <Button onClick={submitDiscussion} disabled={createPost.isPending} className="w-full">
              {t("publish")}
            </Button>
          </TabsContent>

          <TabsContent value="poll" className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("pollQuestionPlaceholder")}
              rows={2}
            />
            {pollOptions.map((opt, i) => (
              <Input
                key={i}
                value={opt}
                onChange={(e) => {
                  const next = [...pollOptions];
                  next[i] = e.target.value;
                  setPollOptions(next);
                }}
                placeholder={t("pollOptionPlaceholder", { n: i + 1 })}
              />
            ))}
            {pollOptions.length < 4 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPollOptions([...pollOptions, ""])}
              >
                {t("addPollOption")}
              </Button>
            ) : null}
            <div className="flex items-center gap-2">
              <Checkbox
                id="poll-spoiler"
                checked={hasSpoiler}
                onCheckedChange={(v) => setHasSpoiler(v === true)}
              />
              <Label htmlFor="poll-spoiler" className="text-xs">
                {t("markSpoiler")}
              </Label>
            </div>
            <Button onClick={submitPoll} disabled={createPost.isPending} className="w-full">
              {t("publishPoll")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
