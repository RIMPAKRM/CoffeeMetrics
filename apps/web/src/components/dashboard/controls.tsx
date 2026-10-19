"use client";

import { PERIODS, type Period } from "@app/shared";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useLocations } from "@/lib/hooks";

export function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-sand p-1">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
            value === p
              ? "bg-coffee-800 text-cream shadow-sm"
              : "text-coffee-600 hover:text-coffee-800"
          }`}
        >
          {p} дней
        </button>
      ))}
    </div>
  );
}

export function LocationSelect({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (id: number | undefined) => void;
}) {
  const { data: locations } = useLocations();
  const current = locations?.find((l) => l.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 rounded-full border-border bg-card px-4 text-sm font-medium"
        >
          Точка:{" "}
          <span className="font-semibold">{current?.name ?? "Все точки"}</span>
          <ChevronDown className="ml-1 size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onChange(undefined)}>
          Все точки
          {value === undefined && <Check className="ml-auto size-4" />}
        </DropdownMenuItem>
        {(locations ?? []).map((loc) => (
          <DropdownMenuItem key={loc.id} onClick={() => onChange(loc.id)}>
            {loc.name}
            {value === loc.id && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LiveToggle({
  live,
  onChange,
}: {
  live: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4">
      <span className={`relative flex size-2 ${live ? "" : "opacity-40"}`}>
        {live && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
        )}
        <span className="relative inline-flex size-2 rounded-full bg-brand" />
      </span>
      <span className="text-sm font-medium">Live</span>
      <Switch
        checked={live}
        onCheckedChange={onChange}
        aria-label="Live-обновление"
        className="data-[state=checked]:bg-brand"
      />
    </div>
  );
}
