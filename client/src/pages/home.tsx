import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Prospect } from "@shared/schema";
import { STATUSES, INTEREST_LEVELS } from "@shared/schema";
import { ProspectCard } from "@/components/prospect-card";
import { AddProspectForm } from "@/components/add-prospect-form";
import { Briefcase, Plus, Flame, ThumbsUp, Minus, Filter, Check } from "lucide-react";
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

type InterestLevel = typeof INTEREST_LEVELS[number];
type ColumnFilter = Set<InterestLevel>;

const ALL_LEVELS: Set<InterestLevel> = new Set(INTEREST_LEVELS);

const columnColors: Record<string, string> = {
  Bookmarked: "bg-blue-500",
  Applied: "bg-indigo-500",
  "Phone Screen": "bg-violet-500",
  Interviewing: "bg-amber-500",
  Offer: "bg-emerald-500",
  Rejected: "bg-red-500",
  Withdrawn: "bg-gray-500",
};

const levelOptions: { label: string; value: InterestLevel; icon: React.ReactNode }[] = [
  { label: "High", value: "High", icon: <Flame className="w-3 h-3 text-red-500" /> },
  { label: "Medium", value: "Medium", icon: <ThumbsUp className="w-3 h-3 text-amber-500" /> },
  { label: "Low", value: "Low", icon: <Minus className="w-3 h-3 text-gray-400" /> },
];

function isAllSelected(filter: ColumnFilter): boolean {
  return filter.size === ALL_LEVELS.size;
}

function FilterDropdown({
  filter,
  onFilterChange,
  statusKey,
}: {
  filter: ColumnFilter;
  onFilterChange: (f: ColumnFilter) => void;
  statusKey: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = `filter-menu-${statusKey}`;
  const allSelected = isAllSelected(filter);

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
      itemRefs.current[0]?.focus();
    }
  }, [open]);

  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
  }, []);

  const toggleLevel = useCallback(
    (level: InterestLevel) => {
      const next = new Set(filter);
      if (next.has(level)) {
        next.delete(level);
        if (next.size === 0) {
          onFilterChange(new Set(ALL_LEVELS));
          return;
        }
      } else {
        next.add(level);
      }
      onFilterChange(next);
    },
    [filter, onFilterChange],
  );

  const toggleAll = useCallback(() => {
    onFilterChange(new Set(ALL_LEVELS));
  }, [onFilterChange]);

  const totalItems = levelOptions.length + 1;

  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = (index + 1) % totalItems;
        itemRefs.current[next]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (index - 1 + totalItems) % totalItems;
        itemRefs.current[prev]?.focus();
      } else if (e.key === "Tab") {
        setOpen(false);
      }
    },
    [totalItems],
  );

  const activeFilterLabel = allSelected
    ? ""
    : `: ${Array.from(filter).join(", ")}`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Filter by interest level${activeFilterLabel}`}
        data-testid={`button-filter-${statusKey}`}
        onKeyDown={handleTriggerKeyDown}
        className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
          !allSelected
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
          className="absolute right-0 top-full mt-1 z-50 w-36 rounded-md border bg-popover p-1 shadow-md"
        >
          <button
            ref={(el) => { itemRefs.current[0] = el; }}
            role="menuitem"
            data-testid={`button-filter-option-${statusKey}-all`}
            onClick={toggleAll}
            onKeyDown={(e) => handleItemKeyDown(e, 0)}
            className={`flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded transition-colors ${
              allSelected
                ? "bg-primary/10 text-primary font-medium"
                : "text-popover-foreground hover:bg-muted"
            }`}
          >
            <span className="flex items-center justify-center w-3 h-3 flex-shrink-0">
              {allSelected && <Check className="w-3 h-3" />}
            </span>
            All
          </button>
          <div className="h-px bg-border my-1" />
          {levelOptions.map((opt, i) => {
            const checked = filter.has(opt.value);
            return (
              <button
                key={opt.value}
                ref={(el) => { itemRefs.current[i + 1] = el; }}
                role="menuitemcheckbox"
                aria-checked={checked}
                data-testid={`button-filter-option-${statusKey}-${opt.value.toLowerCase()}`}
                onClick={() => toggleLevel(opt.value)}
                onKeyDown={(e) => handleItemKeyDown(e, i + 1)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded transition-colors ${
                  checked
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-popover-foreground hover:bg-muted"
                }`}
              >
                <span className="flex items-center justify-center w-3 h-3 flex-shrink-0">
                  {checked && <Check className="w-3 h-3" />}
                </span>
                {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                {opt.label}
              </button>
            );
          })}
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
  filter: ColumnFilter;
  onFilterChange: (filter: ColumnFilter) => void;
}) {
  const statusKey = status.replace(/\s+/g, "-").toLowerCase();
  const allSelected = isAllSelected(filter);
  const filteredProspects = allSelected
    ? prospects
    : prospects.filter((p) => filter.has(p.interestLevel as InterestLevel));

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
                {!allSelected ? "No matching prospects" : "No prospects"}
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
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>(() =>
    STATUSES.reduce(
      (acc, s) => ({ ...acc, [s]: new Set(ALL_LEVELS) }),
      {} as Record<string, ColumnFilter>,
    )
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
              filter={columnFilters[status] || new Set(ALL_LEVELS)}
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
