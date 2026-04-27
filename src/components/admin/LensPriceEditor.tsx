"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type LensPriceRow = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  value: number;
  valueType: "PRICE" | "MULTIPLIER";
  group: string | null;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
};

type LensScope = "EYEGLASSES" | "SUNGLASSES" | "CONTACT_LENSES" | "GLOBAL";

const SCOPE_ORDER: LensScope[] = ["EYEGLASSES", "SUNGLASSES", "CONTACT_LENSES", "GLOBAL"];
const SCOPE_LABELS: Record<LensScope, string> = {
  EYEGLASSES: "Eyeglasses",
  SUNGLASSES: "Sunglasses",
  CONTACT_LENSES: "Contact Lenses",
  GLOBAL: "Global Add-ons",
};

function inferLensScope(item: LensPriceRow): LensScope {
  const key = item.key.toLowerCase();
  const category = (item.category || "").toLowerCase();

  if (key.startsWith("contact_") || category.includes("contact")) return "CONTACT_LENSES";
  if (key.startsWith("drv_") || category.includes("sunglasses")) return "SUNGLASSES";
  if (
    key.startsWith("psv_") ||
    key.startsWith("pbf_") ||
    key.startsWith("ppg_") ||
    key.startsWith("reader_") ||
    key.startsWith("nonrx_") ||
    category.includes("prescription") ||
    category.includes("reader") ||
    category.includes("non-prescription")
  ) {
    return "EYEGLASSES";
  }

  return "GLOBAL";
}

function buildSectionLabel(item: LensPriceRow) {
  const category = item.category?.trim() || "General";
  const group = item.group?.trim() || "";
  if (!group || group.toLowerCase() === category.toLowerCase()) return category;
  return `${category} -> ${group}`;
}

function groupRowsByScope(items: LensPriceRow[]) {
  const grouped = new Map<LensScope, Map<string, LensPriceRow[]>>();
  for (const item of items) {
    const scope = inferLensScope(item);
    const section = buildSectionLabel(item);
    const scopeMap = grouped.get(scope) || new Map<string, LensPriceRow[]>();
    const rows = scopeMap.get(section) || [];
    rows.push(item);
    scopeMap.set(section, rows);
    grouped.set(scope, scopeMap);
  }

  return SCOPE_ORDER.map((scope) => {
    const sections = Array.from(grouped.get(scope)?.entries() || [])
      .map(([section, rows]) => ({
        section,
        rows: rows.sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key)),
      }))
      .sort((a, b) => a.section.localeCompare(b.section));

    return {
      scope,
      label: SCOPE_LABELS[scope],
      count: sections.reduce((sum, section) => sum + section.rows.length, 0),
      sections,
    };
  }).filter((scope) => scope.count > 0);
}

export default function LensPriceEditor({ initialItems }: { initialItems: LensPriceRow[] }) {
  const [baseline, setBaseline] = useState<LensPriceRow[]>(initialItems);
  const [items, setItems] = useState<LensPriceRow[]>(initialItems);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeScope, setActiveScope] = useState<LensScope | "ALL">("ALL");

  const searchedItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.key.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q) ||
        (item.group || "").toLowerCase().includes(q) ||
        (item.category || "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const scopeCounts = useMemo(() => {
    return SCOPE_ORDER.reduce(
      (acc, scope) => {
        acc[scope] = searchedItems.filter((item) => inferLensScope(item) === scope).length;
        return acc;
      },
      {} as Record<LensScope, number>,
    );
  }, [searchedItems]);

  const scopeFilteredItems = useMemo(() => {
    if (activeScope === "ALL") return searchedItems;
    return searchedItems.filter((item) => inferLensScope(item) === activeScope);
  }, [searchedItems, activeScope]);

  const grouped = useMemo(() => groupRowsByScope(scopeFilteredItems), [scopeFilteredItems]);
  const hasChanges = useMemo(() => JSON.stringify(items) !== JSON.stringify(baseline), [items, baseline]);

  async function saveAll() {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/lens-prices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save lens prices");
      setBaseline(items);
      toast.success(`Saved ${result.count || items.length} lens pricing records`);
    } catch (error: any) {
      toast.error(error.message || "Unable to save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search by key, title or group" />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setItems(baseline)} disabled={!hasChanges || saving}>
            <RotateCcw size={14} />
            Discard
          </Button>
          <Button type="button" onClick={saveAll} disabled={!hasChanges || saving}>
            <Save size={14} />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={activeScope === "ALL" ? "default" : "outline"} onClick={() => setActiveScope("ALL")} className="h-9">
          All ({searchedItems.length})
        </Button>
        {SCOPE_ORDER.map((scope) => (
          <Button
            key={scope}
            type="button"
            variant={activeScope === scope ? "default" : "outline"}
            onClick={() => setActiveScope(scope)}
            className="h-9"
          >
            {SCOPE_LABELS[scope]} ({scopeCounts[scope] || 0})
          </Button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-md border border-slate-200 px-4 py-6 text-sm text-slate-500">
          No lens pricing rows found for selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((scopeBlock) => (
            <section key={scopeBlock.scope} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-base font-semibold text-slate-900">{scopeBlock.label}</h3>
                <p className="text-xs text-slate-500">{scopeBlock.count} options</p>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {scopeBlock.sections.map((section) => (
                  <AccordionItem key={`${scopeBlock.scope}-${section.section}`} value={`${scopeBlock.scope}-${section.section}`}>
                    <AccordionTrigger>
                      <div>
                        <p>{section.section}</p>
                        <p className="text-xs font-normal text-slate-500">{section.rows.length} options</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {section.rows.map((row) => (
                          <div key={row.id || row.key} className="grid gap-2 rounded-md border border-slate-200 p-3 md:grid-cols-[1.6fr_1fr_140px_110px]">
                            <div>
                              <p className="text-sm font-semibold">{row.title}</p>
                              <p className="text-xs text-slate-500">{row.key}</p>
                              {row.description ? <p className="mt-1 text-xs text-slate-500">{row.description}</p> : null}
                            </div>
                            <Input
                              value={row.value}
                              type="number"
                              step="0.01"
                              onChange={(event) =>
                                setItems((prev) =>
                                  prev.map((item) =>
                                    item.key === row.key ? { ...item, value: Number(event.target.value || 0) } : item,
                                  ),
                                )
                              }
                            />
                            <div className="flex items-center rounded-md border border-slate-200 px-3 text-sm text-slate-600">
                              {row.valueType === "PRICE" ? "Rs." : "x"} {Number(row.value).toFixed(2)}
                            </div>
                            <label className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
                              Active
                              <Switch
                                checked={row.isActive}
                                onCheckedChange={(checked) =>
                                  setItems((prev) => prev.map((item) => (item.key === row.key ? { ...item, isActive: checked } : item)))
                                }
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
