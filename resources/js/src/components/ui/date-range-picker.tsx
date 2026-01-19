import * as React from "react";
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  presets?: DateRangePreset[];
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  showClear?: boolean;
}

export interface DateRangePreset {
  label: string;
  value: number | "today" | "yesterday" | "week" | "month" | "year";
  description?: string;
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  { 
    label: "Today", 
    value: "today",
    description: "Current day"
  },
  { 
    label: "Yesterday", 
    value: "yesterday",
    description: "Previous day"
  },
  { 
    label: "Last 7 days", 
    value: -7,
    description: "Week to date"
  },
  { 
    label: "Last 30 days", 
    value: -30,
    description: "Month to date"
  },
  { 
    label: "This week", 
    value: "week",
    description: "Monday to today"
  },
  { 
    label: "This month", 
    value: "month",
    description: "Month to date"
  },
  { 
    label: "This year", 
    value: "year",
    description: "Year to date"
  },
];

export function DateRangePicker({
  value,
  onChange,
  label,
  placeholder = "Select date range",
  disabled = false,
  required = false,
  className,
  align = "start",
  presets = DEFAULT_PRESETS,
  minDate,
  maxDate = new Date(),
  error,
  showClear = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(value);
  const [selectedMonth, setSelectedMonth] = React.useState<Date | undefined>(
    value?.from || new Date()
  );

  // Update internal state when value changes
  React.useEffect(() => {
    setInternalRange(value);
    if (value?.from) {
      setSelectedMonth(value.from);
    }
  }, [value]);

  const handlePresetSelect = (preset: DateRangePreset) => {
    const today = new Date();
    let from: Date;
    let to: Date = endOfDay(today);

    switch (preset.value) {
      case "today":
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        from = startOfDay(yesterday);
        to = endOfDay(yesterday);
        break;
      case "week": {
        // Start of week (Monday)
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        from = startOfDay(new Date(today.setDate(diff)));
        break;
      }
      case "month":
        from = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));
        break;
      case "year":
        from = startOfDay(new Date(today.getFullYear(), 0, 1));
        break;
      default:
        // Handle number values
        from = startOfDay(new Date(today.getTime() + preset.value * 24 * 60 * 60 * 1000));
        break;
    }

    const newRange = { from, to };
    setInternalRange(newRange);
    onChange(newRange);
    setIsOpen(false);
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setInternalRange(range);
    // Don't close popover or call onChange yet - wait for Apply
  };

  const handleApply = () => {
    onChange(internalRange);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setInternalRange(value); // Reset to original value
    setIsOpen(false);
  };

  const handleClear = () => {
    const clearedRange = undefined;
    setInternalRange(clearedRange);
    onChange(clearedRange);
  };

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "MMM dd, yyyy");
  };

  const formatRangeDisplay = () => {
    if (!internalRange?.from) return placeholder;
    
    const fromStr = formatDateDisplay(internalRange.from);
    const toStr = internalRange.to ? formatDateDisplay(internalRange.to) : "";
    
    if (!toStr) return fromStr;
    return `${fromStr} - ${toStr}`;
  };

  const calculateDayDifference = () => {
    if (!internalRange?.from || !internalRange?.to) return 0;
    const diffTime = Math.abs(internalRange.to.getTime() - internalRange.from.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          
          {internalRange?.from && (
            <Badge variant="outline" className="text-xs">
              {calculateDayDifference()} day{calculateDayDifference() !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !internalRange && "text-muted-foreground",
                error && "border-destructive"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatRangeDisplay()}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0" 
            align={align}
            onInteractOutside={(e) => {
              // Don't close when interacting with the calendar
              const target = e.target as HTMLElement;
              if (target.closest('.rdp')) {
                e.preventDefault();
              }
            }}
          >
            <div className="flex flex-col sm:flex-row">
              {/* Left Side: Presets */}
              <div className="w-full sm:w-48 p-3 border-r bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Quick Select</h4>
                <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                  {presets.map((preset) => (
                    <Button
                      key={`${preset.label}-${preset.value}`}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <div className="text-left truncate">
                        <div className="font-medium truncate">{preset.label}</div>
                        {preset.description && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {preset.description}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Right Side: Calendar and Actions */}
              <div className="w-full sm:w-auto p-3">
                <Calendar
                  mode="range"
                  selected={internalRange}
                  onSelect={handleCalendarSelect}
                  month={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  numberOfMonths={1}
                  disabled={(date) => {
                    if (minDate && date < minDate) return true;
                    if (maxDate && date > maxDate) return true;
                    return false;
                  }}
                  className="rounded-md border"
                />

                {/* Selected Range Preview */}
                <div className="mt-3 p-2 bg-muted/30 rounded-md text-sm">
                  <div className="font-medium">Selected Range:</div>
                  <div className="text-muted-foreground">
                    {internalRange?.from ? (
                      internalRange.to ? (
                        `${formatDateDisplay(internalRange.from)} - ${formatDateDisplay(internalRange.to)}`
                      ) : (
                        `${formatDateDisplay(internalRange.from)} (Select end date)`
                      )
                    ) : (
                      "Select start date"
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t">
                  <div>
                    {showClear && internalRange && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        disabled={disabled}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleApply}
                      disabled={!internalRange?.from}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {showClear && value?.from && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

export default DateRangePicker;