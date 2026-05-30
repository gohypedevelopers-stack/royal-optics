"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Save, Search, Plus, Trash2 } from "lucide-react";
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
  isNew?: boolean;
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

  // If category is Non-Prescription, it's always Eyeglasses (even with legacy drv_ key prefix)
  if (category === "non-prescription") return "EYEGLASSES";

  // Sunglasses options (keys starting with drv_ or containing sunglasses in category)
  if (key.startsWith("drv_") || category.includes("sunglasses")) return "SUNGLASSES";

  if (
    key.startsWith("psv_") ||
    key.startsWith("pbf_") ||
    key.startsWith("ppg_") ||
    key.startsWith("reader_") ||
    key.startsWith("nonrx_") ||
    category.includes("prescription") ||
    category.includes("reader")
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

  function addNewRowToSection(scope: LensScope, sectionLabel: string) {
    let category = sectionLabel;
    let group = "";
    if (sectionLabel.includes(" -> ")) {
      const parts = sectionLabel.split(" -> ");
      category = parts[0];
      group = parts[1];
    }

    const catLower = category.toLowerCase();
    let prefix = "";
    if (catLower.includes("single")) prefix = "psv_";
    else if (catLower.includes("sunglass")) prefix = "drv_sv_";

    const tempId = `temp-${Date.now()}`;
    const randSuffix = Math.random().toString(36).substring(2, 6);
    const newKey = `${prefix}new_option_${randSuffix}`;

    const newItem: LensPriceRow = {
      id: tempId,
      key: newKey,
      title: "",
      description: null,
      value: 0,
      valueType: "PRICE",
      group: group || null,
      category: category || null,
      sortOrder: items.length,
      isActive: true,
      isNew: true,
    };

    setItems((prev) => [...prev, newItem]);
    toast.success(`Created editable option row inside "${sectionLabel}"!`);
  }

  async function saveAll() {
    // Basic validation before saving
    const invalidItem = items.find((item) => !item.title.trim() || !item.key.trim());
    if (invalidItem) {
      toast.error("All lens options must have a valid Title and Key before saving.");
      return;
    }

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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search by key, title or group" />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setItems(baseline)} disabled={!hasChanges || saving}>
            <RotateCcw size={14} className="mr-1" />
            Discard
          </Button>
          <Button type="button" onClick={saveAll} disabled={!hasChanges || saving}>
            <Save size={14} className="mr-1" />
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
        <div className="rounded-md border border-slate-200 dark:border-slate-800 px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
          No lens pricing rows found for selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((scopeBlock) => (
            <section key={scopeBlock.scope} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
              <div className="mb-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{scopeBlock.label}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{scopeBlock.count} options</p>
              </div>

              <Accordion type="multiple" className="space-y-2">
                {scopeBlock.sections.map((section) => (
                  <AccordionItem key={`${scopeBlock.scope}-${section.section}`} value={`${scopeBlock.scope}-${section.section}`}>
                    <AccordionTrigger>
                      <div>
                        <p>{section.section}</p>
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">{section.rows.length} options</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {section.rows.map((row) => (
                          <div
                            key={row.id || row.key}
                            className="grid gap-2 rounded-md border border-slate-200 dark:border-slate-800 p-3 md:grid-cols-[1.6fr_1fr_140px_110px_45px] items-center"
                          >
                            {/* Col 1: Info/Inline Editor */}
                            {row.isNew ? (
                              <div className="space-y-2 min-w-0">
                                <Input
                                  value={row.title}
                                  onChange={(e) => {
                                    const newTitle = e.target.value;
                                    const generatedKey = newTitle
                                      .toLowerCase()
                                      .trim()
                                      .replace(/[^a-z0-9]+/g, "_");
                                    const cat = (row.category || "").toLowerCase();
                                    let prefix = "";
                                    if (cat.includes("single")) prefix = "psv_";
                                    else if (cat.includes("sunglass")) prefix = "drv_sv_";
                                    
                                    setItems((prev) =>
                                      prev.map((item) =>
                                        item.id === row.id
                                          ? { ...item, title: newTitle, key: prefix + generatedKey }
                                          : item
                                      )
                                    );
                                  }}
                                  placeholder="Option Title (e.g. Premium Blu Block)"
                                  className="h-9 text-sm font-medium border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-1 focus:ring-blue-500 w-full"
                                  required
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="relative flex items-center">
                                    <span className="absolute left-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">Key:</span>
                                    <Input
                                      value={row.key}
                                      onChange={(e) =>
                                        setItems((prev) =>
                                          prev.map((item) =>
                                            item.id === row.id ? { ...item, key: e.target.value } : item
                                          )
                                        )
                                      }
                                      placeholder="key_name"
                                      className="h-8 pl-9 text-[11px] font-mono border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 w-full"
                                      required
                                    />
                                  </div>
                                  <div className="relative flex items-center">
                                    <span className="absolute left-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 select-none">Desc:</span>
                                    <Input
                                      value={row.description || ""}
                                      onChange={(e) =>
                                        setItems((prev) =>
                                          prev.map((item) =>
                                            item.id === row.id ? { ...item, description: e.target.value || null } : item
                                          )
                                        )
                                      }
                                      placeholder="optional"
                                      className="h-8 pl-11 text-[11px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm font-semibold">{row.title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{row.key}</p>
                                {row.description ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.description}</p> : null}
                              </div>
                            )}

                            {/* Col 2: Value Input (standard shadcn Input) */}
                            <Input
                              type="number"
                              step="0.01"
                              value={row.value}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((item) =>
                                    item.id === row.id ? { ...item, value: Number(e.target.value || 0) } : item
                                  )
                                )
                              }
                            />

                            {/* Col 3: Value Type Box or Dropdown select */}
                            {row.isNew ? (
                              <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-800 h-10 overflow-hidden bg-white dark:bg-slate-950">
                                <select
                                  value={row.valueType}
                                  onChange={(e) =>
                                    setItems((prev) =>
                                      prev.map((item) =>
                                        item.id === row.id ? { ...item, valueType: e.target.value as "PRICE" | "MULTIPLIER" } : item
                                      )
                                    )
                                  }
                                  className="h-full w-full bg-transparent border-none outline-none px-3 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer focus:ring-0 dark:bg-slate-950"
                                >
                                  <option value="PRICE">Rs. Flat Price</option>
                                  <option value="MULTIPLIER">x Multiplier</option>
                                </select>
                              </div>
                            ) : (
                              <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-800 px-3 text-sm text-slate-600 dark:text-slate-300 h-10 bg-slate-50/50 dark:bg-slate-900/20">
                                {row.valueType === "PRICE" ? "Rs." : "x"} {Number(row.value).toFixed(2)}
                              </div>
                            )}

                            {/* Col 4: Active Switch */}
                            <label className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm h-10">
                              Active
                              <Switch
                                checked={row.isActive}
                                onCheckedChange={(checked) =>
                                  setItems((prev) =>
                                    prev.map((item) => (item.id === row.id ? { ...item, isActive: checked } : item))
                                  )
                                }
                              />
                            </label>

                            {/* Col 5: Trash/Delete button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setItems((prev) => prev.filter((item) => item.id !== row.id));
                                toast.success(`Removed "${row.title || 'Option'}" locally. Click "Save All Changes" to persist.`);
                              }}
                              className="h-10 w-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}

                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addNewRowToSection(scopeBlock.scope, section.section)}
                            className="w-full border-dashed border-slate-300 dark:border-slate-700 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-slate-900/50 h-10 transition-all duration-200"
                          >
                            <Plus size={14} className="mr-1" />
                            Add Option to {section.section}
                          </Button>
                        </div>
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
