"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";

const GENRES = [
  "ACTION",
  "COMEDY",
  "DRAMA",
  "HORROR",
  "SCIFI",
  "ROMANCE",
  "THRILLER",
  "ANIMATION",
  "DOCUMENTARY",
  "FANTASY",
];

const AGE_RATINGS = ["P", "C13", "C16", "C18"] as const;
const FORMATS = ["2D", "3D", "IMAX", "4DX", "DOLBY"] as const;

interface MovieFilterProps {
  onFilterChange?: () => void;
  collapsibleOnMobile?: boolean;
}

export function MovieFilter({ onFilterChange, collapsibleOnMobile = true }: MovieFilterProps) {
  const t = useTranslations("movies");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";
  const genre = searchParams.get("genre") || "";
  const language = searchParams.get("language") || "";
  const ageRating = searchParams.get("ageRating") || "";
  const durationMin = searchParams.get("durationMin") || "";
  const durationMax = searchParams.get("durationMax") || "";
  const formatParam = searchParams.get("format") || "";

  const hasActiveFilters =
    !!q ||
    !!status ||
    !!genre ||
    !!language ||
    !!ageRating ||
    !!durationMin ||
    !!durationMax ||
    !!formatParam;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`?${params.toString()}`);
    onFilterChange?.();
  }

  function clearAllFilters() {
    router.push("?");
    onFilterChange?.();
  }

  const filterContent = (
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t("search") || "Search"}</Label>
        <Input
          placeholder="Search movies..."
          value={q}
          onChange={(e) => updateFilter("q", e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">{t("status") || "Status"}</Label>
        <div className="space-y-2">
          {["NOW_SHOWING", "COMING_SOON"].map((s) => (
            <div key={s} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${s}`}
                checked={status === s}
                onCheckedChange={(checked) => updateFilter("status", checked ? s : "")}
              />
              <Label htmlFor={`status-${s}`} className="cursor-pointer text-sm font-normal">
                {s === "NOW_SHOWING" ? "Now Showing" : "Coming Soon"}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">{t("genres") || "Genre"}</Label>
        <Select
          value={genre || "all"}
          onValueChange={(v) => updateFilter("genre", v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All genres" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genres</SelectItem>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t("language") || "Language"}</Label>
        <Input
          placeholder="e.g. English, Vietnamese"
          value={language}
          onChange={(e) => updateFilter("language", e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">{t("ageRating") || "Age Rating"}</Label>
        <div className="flex flex-wrap gap-2">
          {AGE_RATINGS.map((r) => (
            <Badge
              key={r}
              variant={ageRating === r ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => updateFilter("ageRating", ageRating === r ? "" : r)}
            >
              {r}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t("duration") || "Duration (min)"}</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={durationMin}
            onChange={(e) => updateFilter("durationMin", e.target.value)}
          />
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={durationMax}
            onChange={(e) => updateFilter("durationMax", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">{t("format") || "Format"}</Label>
        <Select
          value={formatParam || "all"}
          onValueChange={(v) => updateFilter("format", v === "all" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All formats" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All formats</SelectItem>
            {FORMATS.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SlidersHorizontal className="h-5 w-5" />
            {t("filters") || "Filters"}
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      {collapsibleOnMobile ? (
        <>
          <Collapsible open={open} onOpenChange={setOpen} className="lg:hidden">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-4 pb-4">
                {open ? "Hide filters" : "Show filters"}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>{filterContent}</CollapsibleContent>
          </Collapsible>
          <div className="hidden lg:block">{filterContent}</div>
        </>
      ) : (
        filterContent
      )}
    </Card>
  );
}
