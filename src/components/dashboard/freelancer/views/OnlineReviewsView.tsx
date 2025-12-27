'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { getFreelancerPostings } from '@/app/actions/freelancer';
import { CampaignAction } from '@/types/freelancer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    LayoutList, LayoutGrid, MessageSquare,
    Calendar, Eye, Share2, ThumbsUp,
    Facebook, Instagram, Twitter, Linkedin, Video, Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnlineReviewsView() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [postings, setPostings] = useState<CampaignAction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        async function load() {
            if (!user) return;
            setIsLoading(true);
            const res = await getFreelancerPostings(user.uid);
            if (res.success && res.postings) {
                setPostings(res.postings);
            }
            setIsLoading(false);
        }
        load();
    }, [user]);

    const getIconForPlatform = (platform?: string) => {
        switch (platform?.toLowerCase()) {
            case 'facebook': return <Facebook className="h-4 w-4 text-blue-600" />;
            case 'instagram': return <Instagram className="h-4 w-4 text-pink-600" />;
            case 'twitter': return <Twitter className="h-4 w-4 text-sky-500" />;
            case 'linkedin': return <Linkedin className="h-4 w-4 text-blue-700" />;
            default: return <Share2 className="h-4 w-4 text-gray-500" />;
        }
    };

    const PostList = ({ data }: { data: CampaignAction[] }) => (
        <div className="rounded-md border bg-white dark:bg-card">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[300px]">Social Media Beitrag</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Kanal</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Thema</TableHead>
                        <TableHead className="text-right">Sichtkontakte</TableHead>
                        <TableHead className="text-right">Reichweite</TableHead>
                        <TableHead className="text-right">Interaktionen</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">No posts found.</TableCell>
                        </TableRow>
                    ) : (
                        data.map((post) => (
                            <TableRow key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                            <Video className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm line-clamp-1">{post.companyName || 'Campaign'}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">Campaign Topic or Title...</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="text-xs font-medium">{new Date(post.createdAt).toLocaleDateString()}</div>
                                    <div className="text-[10px] text-muted-foreground">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-1">{getIconForPlatform(post.platform || 'facebook')}</div>
                                </TableCell>
                                <TableCell><ImageIcon className="h-4 w-4 text-purple-400" /></TableCell>
                                <TableCell><span className="text-xs text-muted-foreground">{post.topic || 'General'}</span></TableCell>
                                <TableCell className="text-right font-mono text-xs">{post.views || '-'}</TableCell>
                                <TableCell className="text-right font-mono text-xs">{post.views ? Math.floor(post.views * 0.9) : '-'}</TableCell>
                                <TableCell className="text-right font-mono text-xs">{post.clicks || '-'}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );

    const PostGrid = ({ data }: { data: CampaignAction[] }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                                <Video className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold line-clamp-1">{post.companyName}</h4>
                                <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        {getIconForPlatform(post.platform)}
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-4">
                        <div className="flex justify-between text-xs text-zinc-500 border-t pt-3">
                            <div className="flex flex-col items-center">
                                <Eye className="h-4 w-4 mb-1" />
                                <span>{post.views || 0}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <Share2 className="h-4 w-4 mb-1" />
                                <span>{post.views ? Math.floor(post.views * 0.8) : 0}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <ThumbsUp className="h-4 w-4 mb-1" />
                                <span>{post.clicks || 0}</span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-xs h-8">
                            View Comments
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 dark:bg-black/10 min-h-full">
            <div>
                <h1 className="text-2xl font-bold">{t('freelancer_views.online_reviews.title')}</h1>
                <p className="text-muted-foreground">{t('freelancer_views.online_reviews.subtitle')}</p>
            </div>

            <div className="bg-white dark:bg-card rounded-xl shadow-sm border p-6">
                <Tabs defaultValue="published" className="w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <TabsList>
                            <TabsTrigger value="published">{t('freelancer_views.online_reviews.tab_published')}</TabsTrigger>
                            <TabsTrigger value="scheduled">{t('freelancer_views.online_reviews.tab_scheduled')}</TabsTrigger>
                            <TabsTrigger value="comments" className="flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5" /> {t('freelancer_views.online_reviews.tab_comments')}
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-7 w-7 p-0", viewMode === 'list' && "bg-white shadow-sm")}
                                onClick={() => setViewMode('list')}
                            >
                                <LayoutList className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn("h-7 w-7 p-0", viewMode === 'grid' && "bg-white shadow-sm")}
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <TabsContent value="published">
                        <div className="mb-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{t('freelancer_views.online_reviews.tab_published')}</h3>
                                <p className="text-sm text-muted-foreground">{t('freelancer_views.online_reviews.subtitle')}</p>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0">
                                {postings.length} {t('freelancer_views.online_reviews.active_badge')}
                            </Badge>
                        </div>
                        {viewMode === 'list' ? <PostList data={postings} /> : <PostGrid data={postings} />}
                    </TabsContent>

                    <TabsContent value="scheduled">
                        <div className="py-12 text-center text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p>{t('freelancer_views.online_reviews.no_scheduled')}</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="comments">
                        {/* Mock interactions view */}
                        <div className="space-y-4">
                            <h3 className="font-bold mb-4">{t('freelancer_views.online_reviews.recent_comments')}</h3>
                            {postings.slice(0, 3).map((post, i) => (
                                <Card key={i} className="border-l-4 border-l-primary">
                                    <CardContent className="p-4">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                                <MessageSquare className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold mb-1">{t('freelancer_views.online_reviews.new_comment')} "{post.companyName || 'Tu Post'}"</div>
                                                <p className="text-sm text-zinc-600 mb-2">"¡Me encanta este producto! ¿Dónde puedo conseguirlo?"</p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>Hace 2 horas</span>
                                                    <Button variant="link" className="h-auto p-0 text-xs">{t('freelancer_views.online_reviews.reply_btn')}</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {postings.length === 0 && <p className="text-muted-foreground text-center py-8">{t('freelancer_views.online_reviews.recent_comments')}: 0</p>}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
