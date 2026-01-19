import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

type Option = { label: string; value: string };

interface MultiSelectProps {
    options: Option[];
    defaultValue?: string[];
    onValueChange: (value: string[]) => void;
    placeholder?: string;
}

export function MultiSelect({ options, defaultValue = [], onValueChange, placeholder }: MultiSelectProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string[]>(defaultValue);
    const [inputValue, setInputValue] = React.useState("");

    const handleUnselect = (value: string) => {
        const next = selected.filter((s) => s !== value);
        setSelected(next);
        onValueChange(next);
    };

    const handleSelect = (value: string) => {
        setInputValue("");
        const next = [...selected, value];
        setSelected(next);
        onValueChange(next);
    };

    const selectables = options.filter((option) => !selected.includes(option.value));

    return (
        <Command onKeyDown={(e) => { if (e.key === "Backspace" && inputValue === "" && selected.length > 0) handleUnselect(selected[selected.length - 1]); }} className="overflow-visible bg-transparent">
            <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="flex flex-wrap gap-1">
                    {selected.map((val) => {
                        const option = options.find((o) => o.value === val);
                        return (
                            <Badge key={val} variant="secondary" className="rounded-sm px-1 font-normal">
                                {option?.label}
                                <button className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onClick={() => handleUnselect(val)}>
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        );
                    })}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        placeholder={selected.length > 0 ? "" : placeholder}
                        className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>
            <div className="relative mt-2">
                {open && selectables.length > 0 ? (
                    <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                        <CommandList>
                            <CommandGroup className="h-full overflow-auto">
                                {selectables.map((option) => (
                                    <CommandItem key={option.value} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }} onSelect={() => handleSelect(option.value)} className="cursor-pointer">
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </div>
                ) : null}
            </div>
        </Command>
    );
}