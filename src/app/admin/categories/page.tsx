'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    doc,
    deleteDoc,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, Subcategory } from '@/types/category';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    MoreHorizontal,
    Plus,
    Pencil,
    Trash2,
    FolderOpen,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CategoryDialog } from './components/CategoryDialog';
import { SubcategoryDialog } from './components/SubcategoryDialog';

// Helper to render dynamic icon
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name];
    if (!IconComponent) return <FolderOpen className={className} />;
    return <IconComponent className={className} />;
};

export default function CategoriesPage() {
    const { t } = useTranslation('admin');
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set()
    );

    // Dialog States
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
    const [parentCategoryForSub, setParentCategoryForSub] = useState<Category | null>(null);

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    // Helper slugify handles German umlauts specifically for IDs
    const safeSlugify = (text: string) => {
        return text
            .toLowerCase()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss')
            .replace(/&/g, 'und')
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    useEffect(() => {
        const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats: Category[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data() as any;
                // Ensure subcategories exists
                if (!data.subcategories) data.subcategories = [];
                cats.push(data as Category);
            });
            setCategories(cats);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedCategories);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedCategories(newSet);
    };

    // --- Category Handlers ---

    const handleCreateCategory = async (data: any) => {
        try {
            const slug = safeSlugify(data.nameDE);
            // Ensure unique ID or just setDoc overwrites.

            const newCategory: Category = {
                id: slug,
                name: {
                    de: data.nameDE,
                    en: data.nameEN,
                    es: data.nameES,
                },
                icon: data.icon,
                order: data.order,
                businessCount: 0,
                subcategories: [],
            };

            await setDoc(doc(db, 'categories', slug), newCategory);
            toast({ title: 'Success', description: 'Category created successfully.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleUpdateCategory = async (data: any, id?: string) => {
        if (!id) return;
        try {
            const categoryRef = doc(db, 'categories', id);
            await updateDoc(categoryRef, {
                'name.de': data.nameDE,
                'name.en': data.nameEN,
                'name.es': data.nameES,
                icon: data.icon,
                order: data.order,
            });
            toast({ title: 'Success', description: 'Category updated successfully.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const openCreateCategory = () => {
        setEditingCategory(null);
        setIsCategoryDialogOpen(true);
    };

    const openEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setIsCategoryDialogOpen(true);
    };

    const confirmDelete = (category: Category) => {
        if (category.businessCount > 0) {
            toast({
                title: 'Cannot Delete',
                description: `This category has ${category.businessCount} associated businesses. Please reassign them first.`,
                variant: 'destructive',
            });
            return;
        }
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        try {
            await deleteDoc(doc(db, 'categories', categoryToDelete.id));
            toast({
                title: 'Category Deleted',
                description: `Category "${categoryToDelete.name.de}" has been removed.`,
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    // --- Subcategory Handlers ---

    const handleSubcategorySubmit = async (data: any, id?: string) => {
        if (!parentCategoryForSub) return;
        const isEdit = !!id;

        const slug = isEdit && id ? id : safeSlugify(data.nameDE);

        const newSubcategory: Subcategory = {
            id: slug,
            name: {
                de: data.nameDE,
                en: data.nameEN,
                es: data.nameES,
            },
            businessCount: isEdit ? (editingSubcategory?.businessCount || 0) : 0,
        };

        try {
            const categoryRef = doc(db, 'categories', parentCategoryForSub.id);
            let newSubcategories = [...(parentCategoryForSub.subcategories || [])];

            if (isEdit) {
                newSubcategories = newSubcategories.map((sub) =>
                    sub.id === id ? newSubcategory : sub
                );
            } else {
                // Check for duplicates
                if (newSubcategories.some((s) => s.id === slug)) {
                    throw new Error('A subcategory with this ID/Name already exists.');
                }
                newSubcategories.push(newSubcategory);
            }

            await updateDoc(categoryRef, { subcategories: newSubcategories });
            toast({ title: 'Success', description: isEdit ? 'Subcategory updated.' : 'Subcategory added.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const openAddSubcategory = (parent: Category) => {
        setParentCategoryForSub(parent);
        setEditingSubcategory(null);
        setIsSubcategoryDialogOpen(true);
    };

    const openEditSubcategory = (parent: Category, sub: Subcategory) => {
        setParentCategoryForSub(parent);
        setEditingSubcategory(sub);
        setIsSubcategoryDialogOpen(true);
    };

    const deleteSubcategory = async (parent: Category, subId: string) => {
        // Ideally verify subcategory businessCount, but it's nested in the same doc or we check the sub object.
        const sub = parent.subcategories.find(s => s.id === subId);
        if (sub && (sub.businessCount || 0) > 0) {
            toast({
                title: 'Cannot Delete',
                description: `Subcategory has ${sub.businessCount} associated businesses.`,
                variant: 'destructive',
            });
            return;
        }

        try {
            const categoryRef = doc(db, 'categories', parent.id);
            const newSubcategories = parent.subcategories.filter((s) => s.id !== subId);
            await updateDoc(categoryRef, { subcategories: newSubcategories });
            toast({ title: 'Success', description: 'Subcategory deleted.' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
                    <p className="text-muted-foreground">
                        Manage categories, subcategories, and structure logic.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={async () => {
                        try {
                            setLoading(true);
                            const { seedCategories } = await import('@/lib/seed-categories');
                            await seedCategories();
                            toast({ title: 'Success', description: 'Categories re-seeded successfully.' });
                        } catch (err: any) {
                            toast({ title: 'Error', description: err.message, variant: 'destructive' });
                        } finally {
                            setLoading(false);
                        }
                    }}>
                        <Icons.Database className="mr-2 h-4 w-4" />
                        Seed Defaults
                    </Button>
                    <Button onClick={openCreateCategory}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Category
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>
                        {categories.length} active categories
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="w-[50px]">Icon</TableHead>
                                <TableHead>Name (DE)</TableHead>
                                <TableHead className="text-right">Businesses</TableHead>
                                <TableHead className="text-right">Subcategories</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((cat) => (
                                <React.Fragment key={cat.id}>
                                    <TableRow className="group">
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => toggleExpand(cat.id)}
                                            >
                                                {expandedCategories.has(cat.id) ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <DynamicIcon name={cat.icon} className="h-5 w-5 text-primary" />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {cat.name.de}
                                            <span className="ml-2 text-xs text-muted-foreground font-mono">
                                                ({cat.id})
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="font-mono">
                                                {cat.businessCount || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {cat.subcategories?.length || 0}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditCategory(cat)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => confirmDelete(cat)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                    {/* Subcategories Row */}
                                    {expandedCategories.has(cat.id) && (
                                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={6} className="p-0">
                                                <div className="p-4 pl-14 bg-muted/30 border-b">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                            Subcategories
                                                        </h4>
                                                        <Button size="sm" variant="outline" className="h-8" onClick={() => openAddSubcategory(cat)}>
                                                            <Plus className="mr-1 h-3 w-3" />
                                                            Add Subcategory
                                                        </Button>
                                                    </div>
                                                    {(!cat.subcategories || cat.subcategories.length === 0) ? (
                                                        <p className="text-sm text-muted-foreground italic pl-2">
                                                            No subcategories defined.
                                                        </p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {cat.subcategories.map((sub) => (
                                                                <div
                                                                    key={sub.id}
                                                                    className="flex items-center justify-between rounded-md border bg-background p-3 text-sm shadow-sm"
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{sub.name.de}</span>
                                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                                            {sub.businessCount || 0} businesses
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={() => openEditSubcategory(cat, sub)}
                                                                        >
                                                                            <Pencil className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                                                            onClick={() => deleteSubcategory(cat, sub.id)}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Main Category Dialog */}
            <CategoryDialog
                open={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
                category={editingCategory}
                onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
            />

            {/* Subcategory Dialog */}
            <SubcategoryDialog
                open={isSubcategoryDialogOpen}
                onOpenChange={setIsSubcategoryDialogOpen}
                subcategory={editingSubcategory}
                parentCategoryName={parentCategoryForSub?.name.de || ''}
                onSubmit={handleSubcategorySubmit}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the category
                            "{categoryToDelete?.name.de}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDelete}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
