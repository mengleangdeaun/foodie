import * as React from "react";
import { format, startOfDay, endOfDay, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
import { Calendar as CalendarIcon, Clock, X, Check, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import api from '@/util/api';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import TimeRangePicker from "./time-range-picker";
import DateRangePicker from "./date-range-picker";
import DateRangePresetSelector from "./date-range-preset-selector";
import { Description } from "@radix-ui/react-toast";
import { faIR } from "date-fns/locale";


export interface DateTimeRange {
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  useTimeRange: boolean;
}

export interface DateTimeRangePickerProps {
  value?: DateTimeRange;
  onChange: (range: DateTimeRange | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  showClear?: boolean;
}

// Date Presets Configuration
const DATE_PRESETS = [
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
];

// Time Presets Configuration
const TIME_PRESETS = [
  { label: "All Day", start: "00:00", end: "23:59", description: "Full 24 hours" },
  { label: "Morning", start: "06:00", end: "12:00", description: "6 AM - 12 PM" },
  { label: "Afternoon", start: "12:00", end: "17:00", description: "12 PM - 5 PM" },
  { label: "Evening", start: "17:00", end: "22:00", description: "5 PM - 10 PM" },
  { label: "Business Hours", start: "09:00", end: "17:00", description: "9 AM - 5 PM" },
];

export function DateTimeRangePicker({
  value,
  onChange,
  label = "Date & Time Range",
  placeholder = "Select date and time range",
  disabled = false,
  required = false,
  className,
  align = "start",
  minDate,
  maxDate = new Date(),
  error,
  showClear = true,
}: DateTimeRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [businessHours, setBusinessHours] = React.useState<{opening_time: string; closing_time: string} | null>(null);
  const [isLoadingBusinessHours, setIsLoadingBusinessHours] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<DateTimeRange | undefined>(() => {
    if (value) return value;
    
    const today = new Date();
    return {
      startDate: startOfDay(subDays(today, 30)), // Default to last 30 days
      endDate: endOfDay(today),
      useTimeRange: false,
      startTime: "00:00",
      endTime: "23:59",
    };
  });

React.useEffect(() => {
  const fetchBusinessHours = async () => {
    setIsLoadingBusinessHours(true);
    try {
      const response = await api.get('/admin/branches/schedules');
      // response.data is the full JSON, .data inside that is the array
      setBusinessHours(response.data.data); 
    } catch (error) {
      console.error('Failed to fetch business hours:', error);
    } finally {
      setIsLoadingBusinessHours(false);
    }
  };
  
  fetchBusinessHours();
}, []);


const timePresets = React.useMemo(() => {
  const basePresets = [
    { label: "All Day", start: "00:00", end: "23:59", description: "Full 24 hours", isFromDb: false },
    { label: "Morning", start: "06:00", end: "12:00", description: "6 AM - 12 PM" , isFromDb: false },
    { label: "Afternoon", start: "12:00", end: "17:00", description: "12 PM - 5 PM" , isFromDb: false },
    { label: "Evening", start: "17:00", end: "22:00", description: "5 PM - 10 PM" , isFromDb: false },
  ];
  
  // Find the relevant branch (e.g., the first one or matching a specific ID)
  const activeBranch = businessHours?.find(b => b.opening_time !== null) || businessHours?.[0];

  if (activeBranch && activeBranch.opening_time) {
    // Format the times to HH:mm (removing the :ss seconds from the DB)
    const start = activeBranch.opening_time.substring(0, 5);
    const end = activeBranch.closing_time.substring(0, 5);

    basePresets.push({
      label: `Business Hours`,
      start: start,
      end: end,
      isFromDb: true,
      description: `${start} - ${end}`,
    });
  } else if (!isLoadingBusinessHours) {
    basePresets.push({
      label: "Business Hours (Default)",
      start: "09:00",
      end: "17:00",
      isFromDb: true,
      description: "9 AM - 5 PM",
    });
  }
  
  return basePresets;
}, [businessHours, isLoadingBusinessHours]);

  const [tempDateRange, setTempDateRange] = React.useState<DateRange | undefined>(
    internalValue ? { from: internalValue.startDate, to: internalValue.endDate } : undefined
  );

  // Update internal state when value changes
  React.useEffect(() => {
    if (value) {
      setInternalValue(value);
      setTempDateRange({ from: value.startDate, to: value.endDate });
    }
  }, [value]);

  // Handle date range change from calendar
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setTempDateRange(range);
    
    if (range?.from) {
      const startDate = startOfDay(range.from);
      const endDate = range.to ? endOfDay(range.to) : endOfDay(range.from);
      
      setInternalValue(prev => ({
        ...prev!,
        startDate,
        endDate,
      }));
    }
  };

  // Handle date preset selection
  const handleDatePresetSelect = (presetValue: string) => {
    const preset = DATE_PRESETS.find(p => p.value === presetValue);
    if (!preset) return;

    const range = preset.getRange();
    setTempDateRange(range);
    setInternalValue(prev => ({
      ...prev!,
      startDate: range.from!,
      endDate: range.to!,
    }));
  };

  // Handle time preset selection
  const handleTimePresetSelect = (preset: typeof TIME_PRESETS[0]) => {
    setInternalValue(prev => ({
      ...prev!,
      useTimeRange: true,
      startTime: preset.start,
      endTime: preset.end,
    }));
  };

  const handleTimeToggle = (checked: boolean) => {
    setInternalValue(prev => ({
      ...prev!,
      useTimeRange: checked,
      startTime: checked ? (prev?.startTime || "00:00") : undefined,
      endTime: checked ? (prev?.endTime || "23:59") : undefined,
    }));
  };

  const handleTimeChange = (start: string, end: string) => {
    setInternalValue(prev => ({
      ...prev!,
      startTime: start,
      endTime: end,
    }));
  };

  const handleApply = () => {
    if (internalValue) {
      onChange(internalValue);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    // Reset to original value
    setInternalValue(value);
    setTempDateRange(value ? { from: value.startDate, to: value.endDate } : undefined);
    setIsOpen(false);
  };

  const handleClear = () => {
    const today = new Date();
    const clearedValue: DateTimeRange = {
      startDate: startOfDay(today),
      endDate: endOfDay(today),
      useTimeRange: false,
    };

    setInternalValue(clearedValue);
    setTempDateRange({ from: clearedValue.startDate, to: clearedValue.endDate });
    onChange(clearedValue);
  };

  // Format display text for trigger button
  const formatDisplayText = () => {
    if (!internalValue) return placeholder;

    const startDateStr = format(internalValue.startDate, "MMM dd, yyyy");
    const endDateStr = format(internalValue.endDate, "MMM dd, yyyy");
    
    let dateText = "";
    if (isSameDay(internalValue.startDate, internalValue.endDate)) {
      dateText = startDateStr;
    } else {
      dateText = `${startDateStr} - ${endDateStr}`;
    }

    if (internalValue.useTimeRange && internalValue.startTime && internalValue.endTime) {
      return `${dateText} (${internalValue.startTime} - ${internalValue.endTime})`;
    }

    return dateText;
  };

  // Calculate duration in days
  const calculateDayDifference = () => {
    if (!internalValue) return 0;
    const diffTime = Math.abs(internalValue.endDate.getTime() - internalValue.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          
          {internalValue && (
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
                "w-full justify-between text-left font-normal group",
                !internalValue && "text-muted-foreground",
                error && "border-destructive"
              )}
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="truncate">{formatDisplayText()}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[800px] p-0" 
            align={align}
            onInteractOutside={(e) => {
              // Don't close when clicking inside the popover
              const target = e.target as HTMLElement;
              if (target.closest('.date-time-picker-content')) {
                e.preventDefault();
              }
            }}
          >
            <div className="date-time-picker-content">
              {/* Header */}
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Select Date & Time Range</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-0">
                {/* Left Column - Date Selection */}
                <div className="border-r p-4">
                  {/* Quick Date Presets */}
                  <div className="mb-6">
                    <Label className="text-sm font-medium mb-3 block">Quick Date Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {DATE_PRESETS.map((preset) => (
                        <Button
                          key={preset.value}
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs justify-start"
                          onClick={() => handleDatePresetSelect(preset.value)}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Calendar */}
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-3 block">Select Dates</Label>
                    <div className="border rounded-lg p-1 bg-muted/20">
                      <Calendar
                        
                        mode="range"
                        selected={tempDateRange}
                        onSelect={handleDateRangeChange}
                        numberOfMonths={1}
                        disabled={(date) => {
                          if (minDate && date < minDate) return true;
                          if (maxDate && date > maxDate) return true;
                          return false;
                        }}
                        className="rounded-md"
                      />
                    </div>
                  </div>

                  {/* Date Range Summary */}
                  {tempDateRange?.from && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-3">
                        <div className="text-xs font-medium text-primary mb-1">Selected Dates</div>
                        <div className="text-sm">
                          {format(tempDateRange.from, "MMM dd, yyyy")}
                          {tempDateRange.to && !isSameDay(tempDateRange.from, tempDateRange.to) && (
                            <> to {format(tempDateRange.to, "MMM dd, yyyy")}</>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Time Selection */}
                <div className="p-4">
                  {/* Time Range Toggle */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4" />
                        Time Range Filter
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {internalValue?.useTimeRange 
                          ? "Filter data within specific hours" 
                          : "Show data for entire day (00:00 - 23:59)"}
                      </p>
                    </div>
                    <Switch
                      checked={internalValue?.useTimeRange || false}
                      onCheckedChange={handleTimeToggle}
                    />
                  </div>

                  {/* Time Range Content */}
                  {internalValue?.useTimeRange ? (
                    <>
                      {/* Quick Time Presets */}
                      <div className="mb-6">
                        <Label className="text-sm font-medium mb-3 block">Quick Time Presets</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {timePresets.map((preset) => (
                              <Button
                                key={preset.label}
                                variant="outline"
                                size="sm"
                                className={`h-11 text-xs justify-start relative`}
                                onClick={() => handleTimePresetSelect(preset)}
                              >
                                {/* The Top-Right Dot Badge */}
                                {preset.isFromDb && (
                                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-50"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                  </span>
                                )}

                                <div className="text-left">
                                  <div className={`font-medium ${preset.isFromDb ? "text-primary" : ""}`}>
                                    {preset.label}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {preset.start} - {preset.end}
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                      </div>

                      {/* Time Range Picker */}
                      <TimeRangePicker
                        startTime={internalValue.startTime || "00:00"}
                        endTime={internalValue.endTime || "23:59"}
                        onStartTimeChange={(start) => handleTimeChange(start, internalValue.endTime || "23:59")}
                        onEndTimeChange={(end) => handleTimeChange(internalValue.startTime || "00:00", end)}
                        label="Custom Time Range"
                        interval={15}
                        hourFormat="24"
                      />
                    </>
                  ) : (
                    // Info when time range is disabled
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h4 className="font-medium mb-2">Full Day Range</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Data will be shown for the entire day (00:00 - 23:59) for each selected date.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTimeToggle(true)}
                      >
                        Enable Time Filter
                      </Button>
                    </div>
                  )}

                  {/* Preview Card */}
                  <Card className="mt-6 border-dashed rounded-md">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="text-xs font-medium text-muted-foreground">Preview</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Date Range</div>
                            <div className="text-muted-foreground">
                              {internalValue?.startDate ? (
                                <>
                                  {format(internalValue.startDate, "MMM dd")}
                                  {!isSameDay(internalValue.startDate, internalValue.endDate) && 
                                    ` - ${format(internalValue.endDate, "MMM dd")}`}
                                </>
                              ) : "Not selected"}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">Time Range</div>
                            <div className="text-muted-foreground">
                              {internalValue?.useTimeRange && internalValue?.startTime && internalValue?.endTime
                                ? `${internalValue.startTime} - ${internalValue.endTime}`
                                : "Full Day (00:00 - 23:59)"
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t p-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {internalValue && (
                    <div>
                      {calculateDayDifference()} day{calculateDayDifference() !== 1 ? 's' : ''}
                      {internalValue.useTimeRange && " with time filter"}
                    </div>
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
                    disabled={!internalValue?.startDate}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Apply Range
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {showClear && value && (
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

export default DateTimeRangePicker;