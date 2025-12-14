import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}) {
  return _jsxs(Popover, {
    children: [
      _jsx(PopoverTrigger, {
        asChild: true,
        children: _jsxs(Button, {
          variant: "outline",
          disabled: disabled,
          className: cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className,
          ),
          children: [
            _jsx(CalendarIcon, { className: "mr-2 h-4 w-4" }),
            date
              ? format(date, "PPP")
              : _jsx("span", { children: placeholder }),
          ],
        }),
      }),
      _jsx(PopoverContent, {
        className: "w-auto p-0",
        children: _jsx(Calendar, {
          mode: "single",
          selected: date,
          onSelect: onDateChange,
          initialFocus: true,
        }),
      }),
    ],
  });
}
