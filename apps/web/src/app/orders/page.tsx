"use client";

import {
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
  type Period,
} from "@app/shared";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import { PeriodSelector } from "@/components/dashboard/controls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatTenge } from "@/lib/format";
import { useLocations, useOrders } from "@/lib/hooks";

function StatusCell({ status }: { status: Order["status"] }) {
  if (status === "preparing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark">
        <Clock className="size-3.5" /> {ORDER_STATUS_LABELS.preparing}
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        <X className="size-3.5" /> {ORDER_STATUS_LABELS.cancelled}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
      <Check className="size-3.5" /> {ORDER_STATUS_LABELS.served}
    </span>
  );
}

function itemsLabel(o: Order) {
  return o.items
    .map((i) => (i.qty > 1 ? `${i.name} ×${i.qty}` : i.name))
    .join(", ");
}

export default function OrdersPage() {
  const [period, setPeriod] = useState<Period>(30);
  const [locationId, setLocationId] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const locations = useLocations();
  const orders = useOrders({
    period,
    locationId,
    status,
    page,
    pageSize: 15,
    q,
  });
  const data = orders.data;

  const resetPage = () => setPage(1);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-coffee-950 sm:text-[28px]">
            Заказы
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data
              ? `${data.total.toLocaleString("ru-RU")} заказов за период`
              : "Загрузка…"}
          </p>
        </div>
        <PeriodSelector
          value={period}
          onChange={(p) => {
            setPeriod(p);
            resetPage();
          }}
        />
      </header>

      <Card className="mt-4 rounded-2xl border-border/70 shadow-[0_1px_3px_rgba(60,40,20,0.06)] sm:mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 p-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                resetPage();
              }}
              placeholder="Номер заказа…"
              className="h-9 rounded-xl bg-sand/40 pl-9"
            />
          </div>
          <Select
            value={locationId === undefined ? "all" : String(locationId)}
            onValueChange={(v) => {
              setLocationId(v === "all" ? undefined : Number(v));
              resetPage();
            }}
          >
            <SelectTrigger className="h-9 w-[calc(50%-6px)] rounded-xl bg-sand/40 sm:w-44">
              <SelectValue placeholder="Все точки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все точки</SelectItem>
              {(locations.data ?? []).map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status ?? "all"}
            onValueChange={(v) => {
              setStatus(v === "all" ? undefined : (v as OrderStatus));
              resetPage();
            }}
          >
            <SelectTrigger className="h-9 w-[calc(50%-6px)] rounded-xl bg-sand/40 sm:w-40">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-28 pl-5">Заказ</TableHead>
                <TableHead className="w-36">Время</TableHead>
                <TableHead>Позиции</TableHead>
                <TableHead className="w-32">Точка</TableHead>
                <TableHead className="w-28 text-right">Сумма</TableHead>
                <TableHead className="w-32 pr-5">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.isPending ? (
                Array.from({ length: 10 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeletons
                  <TableRow key={i} className="border-border/60">
                    <TableCell colSpan={6} className="px-5 py-3">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data && data.items.length > 0 ? (
                data.items.map((o) => (
                  <TableRow key={o.id} className="border-border/60">
                    <TableCell className="pl-5 font-semibold text-coffee-950">
                      #{o.number}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <span className="block truncate text-coffee-950">
                        {itemsLabel(o)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.locationName}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-coffee-950 tabular-nums">
                      {formatTenge(o.total)}
                    </TableCell>
                    <TableCell className="pr-5">
                      <StatusCell status={o.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    Заказы не найдены — попробуйте изменить фильтры
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
            <p className="text-sm text-muted-foreground">
              Страница {data.page} из {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" /> Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
