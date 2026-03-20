import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CityCombobox({ cities, value, onChange, disabled, t }: { cities: any[], value: string, onChange: (val: string) => void, disabled: boolean, t: any }) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between",
                        !value && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    {value
                        ? value
                        : t('form.selectOption')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={true}>
                    <CommandInput
                        placeholder={t('search_city')}
                    />
                    <CommandList>
                        <CommandEmpty>{t('no_results', 'No encontrada.')}</CommandEmpty>
                        <CommandGroup>
                            {cities.map((city) => (
                                <CommandItem
                                    key={`${city.name}-${city.latitude}`}
                                    value={city.name}
                                    onSelect={() => {
                                        onChange(city.name);
                                        setOpen(false);
                                    }}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                    }}
                                    className="cursor-pointer w-full"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === city.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {city.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
