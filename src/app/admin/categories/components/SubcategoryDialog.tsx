'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Subcategory } from '@/types/category';

const subcategorySchema = z.object({
    nameDE: z.string().min(1, 'German name is required'),
    nameEN: z.string().optional(),
    nameES: z.string().optional(),
});

type SubcategoryFormData = z.infer<typeof subcategorySchema>;

interface SubcategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subcategory?: Subcategory | null; // If null, create mode
    parentCategoryName: string;
    onSubmit: (data: SubcategoryFormData, id?: string) => Promise<void>;
}

export function SubcategoryDialog({
    open,
    onOpenChange,
    subcategory,
    parentCategoryName,
    onSubmit,
}: SubcategoryDialogProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SubcategoryFormData>({
        resolver: zodResolver(subcategorySchema),
        defaultValues: {
            nameDE: '',
            nameEN: '',
            nameES: '',
        },
    });

    useEffect(() => {
        if (subcategory) {
            reset({
                nameDE: subcategory.name.de,
                nameEN: subcategory.name.en || '',
                nameES: subcategory.name.es || '',
            });
        } else {
            reset({
                nameDE: '',
                nameEN: '',
                nameES: '',
            });
        }
    }, [subcategory, reset, open]);

    const handleFormSubmit = async (data: SubcategoryFormData) => {
        await onSubmit(data, subcategory?.id);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {subcategory ? 'Edit Subcategory' : 'New Subcategory'}
                    </DialogTitle>
                    <DialogDescription>
                        {subcategory
                            ? `Update subcategory for ${parentCategoryName}.`
                            : `Add a new subcategory to ${parentCategoryName}.`}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="nameDE">Name (German) *</Label>
                        <Input id="nameDE" {...register('nameDE')} />
                        {errors.nameDE && (
                            <p className="text-xs text-destructive">{errors.nameDE.message}</p>
                        )}
                    </div>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nameEN">Name (English)</Label>
                            <Input id="nameEN" {...register('nameEN')} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nameES">Name (Spanish)</Label>
                            <Input id="nameES" {...register('nameES')} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
