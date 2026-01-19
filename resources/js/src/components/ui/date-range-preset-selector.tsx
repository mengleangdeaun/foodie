import * as React from "react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DateRangePreset {
  label: string;
  value: string;
  getRange: () => DateRange;
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: "Today",
    value: "today",
    getRange: () => {
      const today = new Date();
      return {
        from: startOfDay(today),
        to: endOfDay(today),
      };
    },
  },
  {
    label: "Yesterday",
    value: "yesterday",
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
      };
    },
  },
  {
    label: "Last 7 days",
    value: "last7",
    getRange: () => {
      const today = new Date();
      return {
        from: startOfDay(subDays(today, 6)),
        to: endOfDay(today),
      };
    },
  },
  {
    label: "Last 30 days",
    value: "last30",
    getRange: () => {
      const today = new Date();
      return {
        from: startOfDay(subDays(today, 29)),
        to: endOfDay(today),
      };
    },
  },
  {
    label: "This week",
    value: "thisWeek",
    getRange: () => {
      const today = new Date();
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfDay(today),
      };
    },
  },
  {
    label: "Last week",
    value: "lastWeek",
    getRange: () => {
      const today = new Date();
      const lastWeek = subDays(today, 7);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
      };
    },
  },
  {
    label: "This month",
    value: "thisMonth",
    getRange: () => {
      const today = new Date();
      return {
        from: startOfMonth(today),
        to: endOfDay(today),
      };
    },
  },
  {
    label: "Last month",
    value: "lastMonth",
    getRange: () => {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      };
    },
  },
  {
    label: "This year",
    value: "thisYear",
    getRange: () => {
      const today = new Date();
      return {
        from: startOfYear(today),
        to: endOfDay(today),
      };
    },
  },
  {
    label: "Custom range",
    value: "custom",
    getRange: () => ({ from: undefined, to: undefined }),
  },
];

interface DateRangePresetSelectorProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  presets?: DateRangePreset[];
  className?: string;
  disabled?: boolean;
  showCustomOption?: boolean;
}

export function DateRangePresetSelector({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  className,
  disabled = false,
  showCustomOption = true,
}: DateRangePresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<string>("");

  // Find which preset matches the current range
  React.useEffect(() => {
    if (!value?.from || !value?.to) {
      setSelectedPreset("custom");
      return;
    }

    const matchingPreset = presets.find((preset) => {
      if (preset.value === "custom") return false;
      const presetRange = preset.getRange();
      return (
        presetRange.from?.getTime() === value.from?.getTime() &&
        presetRange.to?.getTime() === value.to?.getTime()
      );
    });

    setSelectedPreset(matchingPreset?.value || "custom");
  }, [value, presets]);

  const handlePresetChange = (presetValue: string) => {
    setSelectedPreset(presetValue);
    
    if (presetValue === "custom") {
      onChange({ from: undefined, to: undefined });
      return;
    }

    const preset = presets.find(p => p.value === presetValue);
    if (preset) {
      onChange(preset.getRange());
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "MMM dd, yyyy");
  };

  const getDisplayText = () => {
    if (!value?.from) return "Select range";
    
    const fromStr = formatDate(value.from);
    const toStr = value.to ? formatDate(value.to) : "";
    
    if (!toStr) return fromStr;
    return `${fromStr} - ${toStr}`;
  };

  const getDaysCount = () => {
    if (!value?.from || !value?.to) return 0;
    const diff = Math.abs(value.to.getTime() - value.from.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Select value={selectedPreset} onValueChange={handlePresetChange} disabled={disabled}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {presets
              .filter(preset => preset.value !== "custom" || showCustomOption)
              .map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {value?.from && value?.to && (
          <Badge variant="secondary" className="text-xs">
            {getDaysCount()} days
          </Badge>
        )}
      </div>

      {selectedPreset === "custom" && value && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            className="flex h-9 w-full max-w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={value.from ? format(value.from, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              const newFrom = e.target.value ? new Date(e.target.value) : undefined;
              onChange({ ...value, from: newFrom });
            }}
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            className="flex h-9 w-full max-w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={value.to ? format(value.to, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              const newTo = e.target.value ? new Date(e.target.value) : undefined;
              onChange({ ...value, to: newTo });
            }}
            min={value.from ? format(value.from, 'yyyy-MM-dd') : undefined}
          />
        </div>
      )}

      {value?.from && (
        <div className="text-sm text-muted-foreground">
          {getDisplayText()}
        </div>
      )}
    </div>
  );
}

export default DateRangePresetSelector;