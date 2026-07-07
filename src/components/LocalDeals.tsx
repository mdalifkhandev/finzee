import { Badge } from "@/components/ui/badge";

const deals = [
  { name: "Campus Bookstore", save: "10% off supplies", tag: "Student" },
  { name: "HEB Groceries", save: "$5 off $50", tag: "Groceries" },
  { name: "MetroPass", save: "15% monthly", tag: "Transit" },
];

export function LocalDeals() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Local Deals</h3>
        <Badge variant="secondary" className="text-[10px] sm:text-xs">Near You</Badge>
      </div>
      <ul className="mt-2 sm:mt-3 space-y-2 text-sm">
        {deals.map((d) => (
          <li key={d.name} className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 xs:gap-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-foreground truncate">{d.name}</span>
              <Badge variant="outline" className="text-[10px] sm:text-xs font-normal shrink-0">{d.tag}</Badge>
            </div>
            <span className="font-medium text-green-600 dark:text-green-400 text-xs sm:text-sm">{d.save}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
