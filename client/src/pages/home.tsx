import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Prospect } from "@shared/schema";
import { STATUSES, INTEREST_LEVELS } from "@shared/schema";
import { ProspectCard } from "@/components/prospect-card";
import { AddProspectForm } from "@/components/add-prospect-form";
import { Briefcase, Plus, Flame, ThumbsUp, Minus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

type InterestFilter = "All" | typeof INTEREST_LEVELS[number];

const columnColors: Record<string, string> = {
  Bookmarked: "bg-blue-500",
  Applied: "bg-indigo-500",
  "Phone Screen": "bg-violet-500",
  Interviewing: "bg-amber-500",
  Offer: "bg-emerald-500",
  Rejected: "bg-red-500",
  Withdrawn: "bg-gray-500",
};

const filterOptions: { label: string; value: InterestFilter; icon: React.ReactNode }[] = [
  { label: "All", value: "All", icon: null },
  { label: "High", value: "High", icon: <Flame className="w-3 h-3 text-red-500" /> },
  { label: "Medium", value: "Medium", icon: <ThumbsUp className="w-3 h-3 text-amber-500" /> },
  { label: "Low", value: "Low", icon: <Minus className="w-3 h-3 text-gray-400" /> },
];

function FilterDropdown({
  filter,
  onFilterChange,
  statusKey,
}: {
  filter: InterestFilter;
  onFilterChange: (f: InterestFilter) => void;
  statusKey: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = `filter-menu-${statusKey}`;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const activeIndex = filterOptions.findIndex((o) => o.value === filter);
      itemRefs.current[activeIndex >= 0 ? activeIndex : 0]?.focus();
    }
  }, [open, filter]);

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = (index + 1) % filterOptions.length;
        itemRefs.current[next]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (index - 1 + filterOptions.length) % filterOptions.length;
        itemRefs.current[prev]?.focus();
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    },
    [],
  );

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Filter by interest level${filter !== "All" ? `: ${filter}` : ""}`}
        data-testid={`button-filter-${statusKey}`}
        onKeyDown={handleTriggerKeyDown}
        className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
          filter !== "All"
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Filter className="w-3 h-3" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Interest level filter"
          className="absolute right-0 top-full mt-1 z-50 w-32 rounded-md border bg-popover p-1 shadow-md"
        >
          {filterOptions.map((opt, i) => (
            <button
              key={opt.value}
              ref={(el) => { itemRefs.current[i] = el; }}
              role="menuitemradio"
              aria-checked={filter === opt.value}
              data-testid={`button-filter-option-${statusKey}-${opt.value.toLowerCase()}`}
              onClick={() => {
                onFilterChange(opt.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}
              onKeyDown={(e) => handleItemKeyDown(e, i)}
              className={`flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded transition-colors ${
                filter === opt.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-popover-foreground hover:bg-muted"
              }`}
            >
              {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  prospects,
  isLoading,
  filter,
  onFilterChange,
}: {
  status: string;
  prospects: Prospect[];
  isLoading: boolean;
  filter: InterestFilter;
  onFilterChange: (filter: InterestFilter) => void;
}) {
  const statusKey = status.replace(/\s+/g, "-").toLowerCase();
  const filteredProspects =
    filter === "All"
      ? prospects
      : prospects.filter((p) => p.interestLevel === filter);

  return (
    <div
      className="flex flex-col min-w-[260px] max-w-[320px] w-full bg-muted/40 rounded-md"
      data-testid={`column-${statusKey}`}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <div className={`w-2 h-2 rounded-full ${columnColors[status] || "bg-gray-400"}`} />
        <h3 className="text-sm font-semibold truncate">{status}</h3>
        <div className="ml-auto flex items-center gap-1.5">
          <FilterDropdown
            filter={filter}
            onFilterChange={onFilterChange}
            statusKey={statusKey}
          />
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-5 min-w-[20px] flex items-center justify-center no-default-active-elevate"
            data-testid={`badge-count-${statusKey}`}
          >
            {filteredProspects.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-md" />
              <Skeleton className="h-20 rounded-md" />
            </>
          ) : filteredProspects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center" data-testid={`empty-${statusKey}`}>
              <p className="text-xs text-muted-foreground">
                {filter !== "All" ? "No matching prospects" : "No prospects"}
              </p>
            </div>
          ) : (
            filteredProspects.map((prospect) => (
              <ProspectCard key={prospect.id} prospect={prospect} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, InterestFilter>>(() =>
    STATUSES.reduce((acc, s) => ({ ...acc, [s]: "All" as InterestFilter }), {} as Record<string, InterestFilter>)
  );

  const { data: prospects, isLoading } = useQuery<Prospect[]>({
    queryKey: ["/api/prospects"],
  });

  const groupedByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = (prospects ?? []).filter((p) => p.status === status);
      return acc;
    },
    {} as Record<string, Prospect[]>,
  );

  const totalCount = prospects?.length ?? 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm shrink-0 z-50">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary text-primary-foreground">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight leading-tight" data-testid="text-app-title">
                  JobTrackr
                </h1>
                <p className="text-xs text-muted-foreground" data-testid="text-prospect-count">
                  {totalCount} prospect{totalCount !== 1 ? "s" : ""} tracked
                </p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-prospect">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Prospect
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Prospect</DialogTitle>
                </DialogHeader>
                <AddProspectForm onSuccess={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-4 h-full min-w-max">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              prospects={groupedByStatus[status] || []}
              isLoading={isLoading}
              filter={columnFilters[status] || "All"}
              onFilterChange={(f) =>
                setColumnFilters((prev) => ({ ...prev, [status]: f }))
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}
