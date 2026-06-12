"use client";



import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";

import { SpoilerContent } from "@/components/reviews/spoiler-content";

import { CommunityComments } from "@/components/community/community-comments";

import { ContentReportDialog } from "@/components/community/content-report-dialog";

import { useVoteCommunityPost } from "@/hooks/queries/use-community";

import { useAuth } from "@/providers/auth-provider";

import { toast } from "sonner";

import type { CommunityPostItem } from "./community-types";



type CommunityPostCardProps = {

  post: CommunityPostItem;

  hideMovieLink?: boolean;

};



export function CommunityPostCard({ post, hideMovieLink }: CommunityPostCardProps) {

  const t = useTranslations("community");

  const { isAuthenticated } = useAuth();

  const vote = useVoteCommunityPost();

  const isPoll = post.type === "POLL";

  const pollOptions = post.pollOptions ?? [];

  const totalVotes = pollOptions.reduce((sum, o) => sum + o.votes, 0);



  async function handleVote(optionId: string) {

    if (!isAuthenticated) {

      toast.message(t("loginToVote"));

      return;

    }

    try {

      await vote.mutateAsync({ id: post.id, optionId });

      toast.success(t("voteRecorded"));

    } catch {

      toast.error(t("voteError"));

    }

  }



  return (

    <article className="community-feed-item">

      <p className="text-muted-foreground text-xs">

        <Link href={`/users/${post.userId}`} className="text-foreground hover:underline">

          {post.userName ?? t("unknownUser")}

        </Link>

        {" · "}

        <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString()}</time>

        {isPoll ? ` · ${t("tabPolls")}` : null}

      </p>



      {!hideMovieLink && post.movie ? (

        <Link

          href={`/movies/${post.movie.slug ?? post.movie.id}`}

          className="text-muted-foreground mt-2 inline-block text-xs hover:text-foreground hover:underline"

        >

          {post.movie.title}

        </Link>

      ) : null}



      <SpoilerContent hasSpoiler={post.hasSpoiler} className="mt-2">

        <p className="text-sm leading-relaxed">{post.content}</p>

      </SpoilerContent>



      {post.hashtags && post.hashtags.length > 0 ? (

        <p className="text-muted-foreground mt-2 text-xs">

          {post.hashtags.map((tag) => {

            const normalized = tag.replace(/^#/, "");

            return (

              <Link

                key={tag}

                href={`/community/tag/${encodeURIComponent(normalized)}`}

                className="mr-2 hover:text-foreground hover:underline"

              >

                #{normalized}

              </Link>

            );

          })}

        </p>

      ) : null}



      {isPoll && pollOptions.length > 0 ? (

        <div className="mt-4 space-y-3">

          {pollOptions.map((opt) => {

            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

            return (

              <div key={opt.id}>

                <div className="mb-1 flex justify-between gap-2 text-xs">

                  <span>{opt.label}</span>

                  <span className="text-muted-foreground">{pct}%</span>

                </div>

                <div className="community-poll-bar">

                  <div className="community-poll-bar__fill" style={{ width: `${pct}%` }} />

                </div>

                <Button

                  type="button"

                  variant="ghost"

                  size="sm"

                  className="text-muted-foreground mt-1 h-7 px-0 text-xs hover:bg-transparent"

                  disabled={vote.isPending}

                  onClick={() => handleVote(opt.id)}

                >

                  {t("voteOption")}

                </Button>

              </div>

            );

          })}

        </div>

      ) : null}



      <div className="mt-2">

        <ContentReportDialog targetType="POST" targetId={post.id} />

      </div>



      <CommunityComments targetType="POST" targetId={post.id} />

    </article>

  );

}

