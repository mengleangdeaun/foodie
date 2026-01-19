import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock, ArrowRight, Info } from "lucide-react";
import  TimePicker  from "./time-picker";
import { cn } from "@/lib/utils";

export interface TimeRangePickerProps {
  startTime?: string;
  endTime?: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  interval?: 5 | 10 | 15 | 30;
  hourFormat?: "auto" | "12" | "24";
  error?: {
    startTime?: string;
    endTime?: string;
  };
}

const TimeRangePicker = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  label = "Time Range",
  disabled = false,
  required = false,
  className,
  interval = 15,
  hourFormat = "auto",
  error,
}: TimeRangePickerProps) => {
  // Validate that end time is after start time
  const validateTimeRange = () => {
    if (!startTime || !endTime) return true;
    
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    if (endHour < startHour) return false;
    if (endHour === startHour && endMinute <= startMinute) return false;
    
    return true;
  };

  const isValidRange = validateTimeRange();

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-base font-medium flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <Card className="bg-slate/30 rounded-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <TimePicker
                value={startTime}
                onChange={onStartTimeChange}
                label="From"
                placeholder="Start time"
                disabled={disabled}
                interval={interval}
                hourFormat={hourFormat}
                error={error?.startTime}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1">
              <TimePicker
                value={endTime}
                onChange={onEndTimeChange}
                label="To"
                placeholder="End time"
                disabled={disabled}
                interval={interval}
                hourFormat={hourFormat}
                error={error?.endTime}
                className="w-full"
              />
            </div>
          </div>
          
          {!isValidRange && (
            <div className="mt-3 p-2 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive flex items-center gap-2 ">
               <Info className="h-3 w-3" /> End time must be after start time
              </p>
            </div>
          )}
          
          {startTime && endTime && isValidRange && (
            <div className="mt-3 flex items-center justify-center">
              <div className="text-sm text-muted-foreground bg-background px-3 py-1 rounded-full border">
                Duration: {calculateDuration(startTime, endTime)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to calculate duration
const calculateDuration = (start: string, end: string) => {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  
  let hourDiff = endHour - startHour;
  let minuteDiff = endMinute - startMinute;
  
  if (minuteDiff < 0) {
    hourDiff--;
    minuteDiff += 60;
  }
  
  if (hourDiff < 0) {
    hourDiff += 24; // Handle overnight
  }
  
  if (hourDiff === 0) {
    return `${minuteDiff} minutes`;
  } else if (minuteDiff === 0) {
    return `${hourDiff} hour${hourDiff > 1 ? 's' : ''}`;
  } else {
    return `${hourDiff}h ${minuteDiff}m`;
  }
};

export default TimeRangePicker;