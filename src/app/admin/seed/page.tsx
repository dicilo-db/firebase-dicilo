// src/app/admin/seed/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { ArrowLeft, Terminal, Database, UserPlus, Tag, Loader2 } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { seedCategoriesAction } from '@/app/actions/seed-categories';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

function CategorySeedButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await seedCategoriesAction();
      if (res.success) {
        toast({ title: 'Success', description: res.message });
      } else {
        toast({ title: 'Error', description: res.message, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSeed} disabled={loading} variant="secondary" className="w-full sm:w-auto">
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
      Seed Categories
    </Button>
  );
}

export default function SeedPage() {
  useAuthGuard(['superadmin']); // Protege esta página
  const { t } = useTranslation('admin.seed');

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToLogin')}
            </Link>
          </Button>
        </div>
        <p className="mb-8 text-muted-foreground">{t('pageSubtitle')}</p>

        <div className="space-y-8">
          {/* Step 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus />
                {t('step1Title')}
              </CardTitle>
              <CardDescription>{t('step1Description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>{t('step1AlertTitle')}</AlertTitle>
                <AlertDescription>
                  <ol className="mt-2 list-inside list-decimal space-y-2">
                    <li>{t('step1Instruction1')}</li>
                    <li>
                      {t('step1Instruction2')}
                      <Table className="my-2">
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('emailLabel')}</TableHead>
                            <TableHead>{t('passwordLabel')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-mono">
                              superadmin@dicilo.net
                            </TableCell>
                            <TableCell className="font-mono">
                              superadmin
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </li>
                    <li>{t('step1Instruction3')}</li>
                  </ol>
                </AlertDescription>
              </Alert>
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>{t('step1NoteTitle')}</AlertTitle>
                <AlertDescription>{t('step1NoteDescription')}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database />
                {t('step2Title')}
              </CardTitle>
              <CardDescription>{t('step2Description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>{t('step2AlertTitle')}</AlertTitle>
                <AlertDescription>
                  <ol className="mt-2 list-inside list-decimal space-y-2">
                    <li>{t('step2Instruction1')}</li>
                    <li>
                      {t('step2Instruction2')}{' '}
                      <code className="rounded bg-muted px-1 py-0.5 font-mono">
                        admins
                      </code>
                    </li>
                    <li>{t('step2Instruction3')}</li>
                    <li>
                      {t('step2Instruction4')}
                      <Table className="my-2">
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('field')}</TableHead>
                            <TableHead>{t('value')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-mono">role</TableCell>
                            <TableCell className="font-mono">
                              superadmin
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Category Database Seeding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Category Database
              </CardTitle>
              <CardDescription>
                Initialize the category collection with the standard German list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategorySeedButton />
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('step3Title')}</CardTitle>
              <CardDescription>{t('step3Description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('step3Content')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
