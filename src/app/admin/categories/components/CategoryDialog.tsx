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
import { Category } from '@/types/category';
import { slugify } from '@/lib/utils'; // Ensure this exists or use local helper

const categorySchema = z.object({
    nameDE: z.string().min(1, 'German name is required'),
    nameEN: z.string().optional(),
    nameES: z.string().optional(),
    icon: z.string().min(1, 'Icon name is required'),
    order: z.coerce.number().min(0, 'Order must be positive'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category?: Category | null; // If null, create mode
    onSubmit: (data: CategoryFormData, id?: string) => Promise<void>;
}

export function CategoryDialog({
    open,
    onOpenChange,
    category,
    onSubmit,
}: CategoryDialogProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            nameDE: '',
            nameEN: '',
            nameES: '',
            icon: 'Folder',
            order: 0,
        },
    });

    useEffect(() => {
        if (category) {
            reset({
                nameDE: category.name.de,
                nameEN: category.name.en || '',
                nameES: category.name.es || '',
                icon: category.icon,
                order: category.order,
            });
        } else {
            reset({
                nameDE: '',
                nameEN: '',
                nameES: '',
                icon: 'Folder',
                order: 0,
            });
        }
    }, [category, reset, open]);

    const handleFormSubmit = async (data: CategoryFormData) => {
        await onSubmit(data, category?.id);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {category ? 'Edit Category' : 'New Category'}
                    </DialogTitle>
                    <DialogDescription>
                        {category
                            ? 'Update category details.'
                            : 'Create a new main category.'}
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nameEN">Name (English)</Label>
                            <Input id="nameEN" {...register('nameEN')} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nameES">Name (Spanish)</Label>
                            <Input id="nameES" {...register('nameES')} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="icon">Icon (Lucide Name) *</Label>
                            <Input id="icon" {...register('icon')} />
                            <p className="text-[10px] text-muted-foreground">
                                e.g., "Home", "Briefcase"
                            </p>
                            {errors.icon && (
                                <p className="text-xs text-destructive">{errors.icon.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="order">Order Index</Label>
                            <Input
                                id="order"
                                type="number"
                                {...register('order')}
                            />
                            {errors.order && (
                                <p className="text-xs text-destructive">{errors.order.message}</p>
                            )}
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
