"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CITIES = [
  { id: "hcm", name: "TP. Ho Chi Minh" },
  { id: "hn", name: "Ha Noi" },
  { id: "dn", name: "Da Nang" },
  { id: "hp", name: "Hai Phong" },
  { id: "ct", name: "Can Tho" },
  { id: "bd", name: "Binh Duong" },
  { id: "nt", name: "Nha Trang" },
  { id: "vt", name: "Vung Tau" },
];

export function CitySelector() {
  const t = useTranslations("nav");
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("selected_city");
    if (saved) setSelectedCity(saved);
  }, []);

  function handleSelect(cityId: string) {
    setSelectedCity(cityId);
    localStorage.setItem("selected_city", cityId);
  }

  const currentCity = CITIES.find((c) => c.id === selectedCity);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">{currentCity?.name || t("selectCity")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {CITIES.map((city) => (
          <DropdownMenuItem
            key={city.id}
            onClick={() => handleSelect(city.id)}
            className={selectedCity === city.id ? "bg-accent" : ""}
          >
            {city.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
