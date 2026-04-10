import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from "@/lib/utils";

export function CityCombobox({ cities, value, onChange, disabled, t }: { cities: any[], value: string, onChange: (val: string) => void, disabled: boolean, t: any }) {
    return (
        <Select
            onValueChange={onChange}
            value={value}
            disabled={disabled}
        >
            <SelectTrigger 
                className={cn(
                    "w-full bg-white transition-all hover:bg-slate-50",
                    !value && "text-muted-foreground"
                )}
            >
                <SelectValue placeholder={t('form.selectOption')} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
                {cities.length > 0 ? (
                    cities.map((city) => (
                        <SelectItem 
                            key={`${city.name}-${city.latitude}`} 
                            value={city.name}
                        >
                            {city.name}
                        </SelectItem>
                    ))
                ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                        {t('no_results', 'No hay ciudades.')}
                    </div>
                )}
            </SelectContent>
        </Select>
    );
}
