"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, Film, Clock } from "lucide-react";
import { useMovies } from "@/hooks/queries/use-movies";
import { useCinemas } from "@/hooks/queries/use-cinemas";

export function QuickBookingWidget() {
  const t = useTranslations("home");
  const router = useRouter();
  const [selectedMovie, setSelectedMovie] = useState<string>("");
  const [selectedCinema, setSelectedCinema] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const { data: moviesData } = useMovies({ status: "NOW_SHOWING", limit: 20 });
  const { data: cinemasData } = useCinemas({ limit: 50 });

  const movies: Array<{ id: string; title: string }> = (moviesData?.data ?? []) as any;
  const cinemas: Array<{ id: string; name: string }> = (cinemasData?.data ?? []) as any;

  const today = new Date();
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  function handleQuickBook() {
    const params = new URLSearchParams();
    if (selectedMovie) params.set("movie", selectedMovie);
    if (selectedCinema) params.set("cinema", selectedCinema);
    if (selectedDate) params.set("date", selectedDate);
    router.push(`/showtimes?${params.toString()}`);
  }

  const canBook = selectedMovie || selectedCinema || selectedDate;

  return (
    <Card className="border-primary/20 bg-card/50 border-2 backdrop-blur">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <Calendar className="text-primary h-5 w-5" />
          <h2 className="text-xl font-semibold text-balance">
            {t("quickBooking") || "Quick Booking"}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Movie Select */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Film className="h-4 w-4" />
              {t("selectMovie") || "Select Movie"}
            </Label>
            <Select value={selectedMovie} onValueChange={setSelectedMovie}>
              <SelectTrigger>
                <SelectValue placeholder={t("anyMovie") || "Any Movie"} />
              </SelectTrigger>
              <SelectContent>
                {movies.map((movie) => (
                  <SelectItem key={movie.id} value={movie.id}>
                    {movie.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cinema Select */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              {t("selectCinema") || "Select Cinema"}
            </Label>
            <Select value={selectedCinema} onValueChange={setSelectedCinema}>
              <SelectTrigger>
                <SelectValue placeholder={t("anyCinema") || "Any Cinema"} />
              </SelectTrigger>
              <SelectContent>
                {cinemas.map((cinema) => (
                  <SelectItem key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Select */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {t("selectDate") || "Select Date"}
            </Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder={t("today") || "Today"} />
              </SelectTrigger>
              <SelectContent>
                {next7Days.map((date, i) => (
                  <SelectItem key={i} value={date.toISOString().split("T")[0]}>
                    {i === 0
                      ? t("today") || "Today"
                      : i === 1
                        ? t("tomorrow") || "Tomorrow"
                        : date.toLocaleDateString("vi-VN", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Book Button */}
          <div className="flex items-end">
            <Button onClick={handleQuickBook} disabled={!canBook} className="w-full" size="lg">
              {t("findShowtimes") || "Find Showtimes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
