"use client";

import "./community-page.css";
import { CommunityHeader } from "@/components/community/community-header";
import { CommunityHub } from "@/components/community/community-hub";
import { CommunitySidebar } from "@/components/community/community-sidebar";

export default function CommunityPage() {
  return (
    <div className="community-page mx-auto max-w-5xl px-4 py-8 lg:px-6">
      <CommunityHeader />
      <div className="community-layout">
        <CommunityHub />
        <CommunitySidebar />
      </div>
    </div>
  );
}
