import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom SelectTrigger without icon
const CustomSelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof SelectTrigger>
>(({ className, children, ...props }, ref) => (
  <SelectTrigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    {/* No icon here */}
  </SelectTrigger>
));
CustomSelectTrigger.displayName = "CustomSelectTrigger";

export interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  interval?: 5 | 10 | 15 | 30;
  hourFormat?: "auto" | "12" | "24";
  showSeconds?: boolean;
  error?: string;
  showDropdownIcon?: boolean; // New prop to control icon visibility
}

const TimePicker = ({
  value = "",
  onChange,
  label,
  placeholder = "Select time",
  disabled = false,
  required = false,
  className,
  interval = 15,
  hourFormat = "auto",
  showSeconds = false,
  error,
  showDropdownIcon = false, // Default to hide icon
}: TimePickerProps) => {
  // Generate hours based on format
  const getHours = () => {
    if (hourFormat === "24") {
      return Array.from({ length: 24 }, (_, i) => ({
        value: i.toString().padStart(2, '0'),
        label: i.toString().padStart(2, '0'),
      }));
    }
    
    // For 12-hour format
    return Array.from({ length: 12 }, (_, i) => {
      const hour = i === 0 ? 12 : i;
      return {
        value: hour.toString().padStart(2, '0'),
        label: hour.toString(),
      };
    });
  };

  const getMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i += interval) {
      minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
  };

  const getSeconds = () => {
    return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  };

  const hours = getHours();
  const minutes = getMinutes();
  const seconds = getSeconds();

  const parseTime = () => {
    if (!value) return { hour: "", minute: "", second: "", period: "AM" };
    
    let [hour = "", minute = "", second = ""] = value.split(":");
    let period = "AM";
    
    if (hourFormat === "auto" || hourFormat === "12") {
      const hourNum = parseInt(hour);
      if (hourNum >= 12) {
        period = "PM";
        if (hourNum > 12) hour = (hourNum - 12).toString().padStart(2, '0');
        if (hourNum === 0 || hourNum === 24) hour = "12";
      } else {
        period = "AM";
        if (hourNum === 0) hour = "12";
      }
    }
    
    return { 
      hour: hour.padStart(2, '0'), 
      minute: (minute || "00").padStart(2, '0'), 
      second: (second || "00").padStart(2, '0'), 
      period 
    };
  };

  const currentTime = parseTime();

  const handleTimeChange = (field: "hour" | "minute" | "second" | "period", newValue: string) => {
    const newTime = { ...currentTime, [field]: newValue };
    
    // Convert to 24-hour format
    let hour24 = newTime.hour;
    
    if ((hourFormat === "auto" || hourFormat === "12") && newTime.period === "PM" && newTime.hour !== "12") {
      hour24 = (parseInt(newTime.hour) + 12).toString().padStart(2, '0');
    } else if ((hourFormat === "auto" || hourFormat === "12") && newTime.period === "AM" && newTime.hour === "12") {
      hour24 = "00";
    }
    
    const newTimeString = showSeconds 
      ? `${hour24}:${newTime.minute}:${newTime.second}`
      : `${hour24}:${newTime.minute}`;
    
    onChange(newTimeString);
  };

  // Use either the custom trigger or default based on prop
  const TriggerComponent = showDropdownIcon ? SelectTrigger : CustomSelectTrigger;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="flex flex-wrap gap-2">
        {/* Hour Select */}
        <div className="flex-1 min-w-[70px]">
          <Select
            value={currentTime.hour || undefined}
            onValueChange={(value) => handleTimeChange("hour", value)}
            disabled={disabled}
          >
            <TriggerComponent className="w-full text-center">
              <SelectValue placeholder="HH" />
            </TriggerComponent>
            <SelectContent>
              {hours.map((h) => (
                <SelectItem key={`hour-${h.value}`} value={h.value} className="text-center">
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center">
          <span className="text-muted-foreground">:</span>
        </div>
        
        {/* Minute Select */}
        <div className="flex-1 min-w-[70px]">
          <Select
            value={currentTime.minute || undefined}
            onValueChange={(value) => handleTimeChange("minute", value)}
            disabled={disabled}
          >
            <TriggerComponent className="w-full text-center">
              <SelectValue placeholder="MM" />
            </TriggerComponent>
            <SelectContent>
              {minutes.map((m) => (
                <SelectItem key={`minute-${m}`} value={m} className="text-center">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Seconds Select (optional) */}
        {showSeconds && (
          <>
            <div className="flex items-center">
              <span className="text-muted-foreground">:</span>
            </div>
            <div className="flex-1 min-w-[70px]">
              <Select
                value={currentTime.second || undefined}
                onValueChange={(value) => handleTimeChange("second", value)}
                disabled={disabled}
              >
                <TriggerComponent className="w-full text-center">
                  <SelectValue placeholder="SS" />
                </TriggerComponent>
                <SelectContent>
                  {seconds.map((s) => (
                    <SelectItem key={`second-${s}`} value={s} className="text-center">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {/* AM/PM Select (only for 12-hour format) */}
        {(hourFormat === "auto" || hourFormat === "12") && (
          <div className="flex-1 min-w-[70px]">
            <Select
              value={currentTime.period}
              onValueChange={(value) => handleTimeChange("period", value)}
              disabled={disabled}
            >
              <TriggerComponent className="w-full text-center">
                <SelectValue placeholder="AM/PM" />
              </TriggerComponent>
              <SelectContent>
                <SelectItem value="AM" className="text-center">AM</SelectItem>
                <SelectItem value="PM" className="text-center">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Time display */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className={cn(
            "font-medium",
            value ? "text-foreground" : "text-muted-foreground"
          )}>
            {value ? formatDisplayTime(value, hourFormat) : placeholder}
          </span>
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onChange("")}
            disabled={disabled}
          >
            Clear
          </Button>
        )}
      </div>
      
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
    </div>
  );
};

// Helper function to format display time
const formatDisplayTime = (time: string, hourFormat: string) => {
  if (!time) return "";
  
  const [hour, minute] = time.split(":");
  const hourNum = parseInt(hour);
  
  if (hourFormat === "24") {
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  }
  
  // 12-hour format
  let displayHour = hourNum;
  const period = hourNum >= 12 ? "PM" : "AM";
  
  if (hourNum > 12) displayHour = hourNum - 12;
  if (hourNum === 0 || hourNum === 24) displayHour = 12;
  
  return `${displayHour}:${minute.padStart(2, '0')} ${period}`;
};

export default TimePicker;