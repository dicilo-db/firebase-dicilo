import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getFirestore, updateDoc, onSnapshot } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Share2, Gift, Users, Heart, Settings } from 'lucide-react';
import { CategorySelector } from './CategorySelector';

const db = getFirestore(app);

interface PrivateDashboardProps {
    user: User;
    profile: any;
}

export function PrivateDashboard({ user, profile }: PrivateDashboardProps) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState(profile);

    // Real-time updates for the profile
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'private_profiles', user.uid), (doc) => {
            if (doc.exists()) {
                setFormData(doc.data());
            }
        });
        return () => unsub();
    }, [user.uid]);

    const handleUpdate = async (section: string, data: any) => {
        setIsLoading(true);
        try {
            const userRef = doc(db, 'private_profiles', user.uid);
            await updateDoc(userRef, data);
            toast({
                title: 'Profile Updated',
                description: 'Your changes have been saved successfully.',
            });
        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: 'Error',
                description: 'Failed to save changes. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied!',
            description: 'Code copied to clipboard.',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome, {formData.firstName}!</h1>
                    <p className="text-muted-foreground">Manage your personal profile and preferences.</p>
                </div>
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Your Unique Code</p>
                            <p className="text-2xl font-mono font-bold text-primary">{formData.uniqueCode}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(formData.uniqueCode)}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="personal">Personal Data</TabsTrigger>
                    <TabsTrigger value="interests">Interests</TabsTrigger>
                    <TabsTrigger value="social">Social & Rewards</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Profile Status</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Active</div>
                                <p className="text-xs text-muted-foreground">Member since {new Date(formData.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Interests</CardTitle>
                                <Heart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formData.interests?.length || 0}</div>
                                <p className="text-xs text-muted-foreground">Categories selected</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Referrals</CardTitle>
                                <Gift className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formData.referrals?.length || 0}</div>
                                <p className="text-xs text-muted-foreground">Friends invited</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                <Button variant="outline" className="justify-start" onClick={() => setActiveTab('interests')}>
                                    <Heart className="mr-2 h-4 w-4" /> Update Interests
                                </Button>
                                <Button variant="outline" className="justify-start" onClick={() => setActiveTab('social')}>
                                    <Share2 className="mr-2 h-4 w-4" /> Invite Friends
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Personal Data Tab */}
                <TabsContent value="personal">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details and contact preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input value={formData.firstName} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input value={formData.lastName} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={formData.birthDate ? new Date(formData.birthDate.seconds * 1000).toISOString().split('T')[0] : ''}
                                        onChange={(e) => {
                                            const date = new Date(e.target.value);
                                            handleUpdate('birthDate', { birthDate: date });
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">So we can send you gifts every year!</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Select
                                        value={formData.gender || ''}
                                        onValueChange={(val) => handleUpdate('gender', { gender: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="diverse">Diverse</SelectItem>
                                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-medium">Location</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input
                                            value={formData.country || ''}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            onBlur={() => handleUpdate('country', { country: formData.country })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>City</Label>
                                        <Input
                                            value={formData.city || ''}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            onBlur={() => handleUpdate('city', { city: formData.city })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-medium">Communication Preferences</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Preferred Channel</Label>
                                        <div className="flex gap-4">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroup
                                                    value={formData.contactPreferences?.whatsapp ? 'whatsapp' : formData.contactPreferences?.telegram ? 'telegram' : 'email'}
                                                    onValueChange={(val) => {
                                                        const prefs = { ...formData.contactPreferences };
                                                        if (val === 'whatsapp') { prefs.whatsapp = formData.contactPreferences?.whatsapp || 'yes'; prefs.telegram = ''; }
                                                        if (val === 'telegram') { prefs.telegram = formData.contactPreferences?.telegram || 'yes'; prefs.whatsapp = ''; }
                                                        handleUpdate('contactPreferences', { contactPreferences: prefs });
                                                    }}
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="whatsapp" id="r1" />
                                                        <Label htmlFor="r1">WhatsApp</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="telegram" id="r2" />
                                                        <Label htmlFor="r2">Telegram</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="email" id="r3" />
                                                        <Label htmlFor="r3">Email</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Frequency</Label>
                                        <Select
                                            value={formData.contactPreferences?.frequency || 'weekly'}
                                            onValueChange={(val) => handleUpdate('frequency', {
                                                contactPreferences: { ...formData.contactPreferences, frequency: val }
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Daily</SelectItem>
                                                <SelectItem value="weekly">Weekly</SelectItem>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="important_only">Important Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Interests Tab */}
                <TabsContent value="interests">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Interests</CardTitle>
                            <CardDescription>Select the categories you are interested in.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CategorySelector
                                selectedCategories={formData.interests || []}
                                onChange={(newInterests) => handleUpdate('interests', { interests: newInterests })}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Social Tab */}
                <TabsContent value="social">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Social Groups</CardTitle>
                                <CardDescription>Join our community!</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Would you like to join our social groups?</Label>
                                    <RadioGroup
                                        value={formData.profileData?.socialGroup || 'none'}
                                        onValueChange={(val) => handleUpdate('socialGroup', {
                                            profileData: { ...formData.profileData, socialGroup: val }
                                        })}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="whatsapp" id="s1" />
                                            <Label htmlFor="s1">WhatsApp Group</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="telegram" id="s2" />
                                            <Label htmlFor="s2">Telegram Group</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="none" id="s3" />
                                            <Label htmlFor="s3">Prefer not to join</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {(formData.profileData?.socialGroup === 'whatsapp' || formData.profileData?.socialGroup === 'telegram') && (
                                    <div className="pt-4">
                                        <Button className="w-full" onClick={() => window.open(formData.profileData?.socialGroup === 'whatsapp' ? 'https://chat.whatsapp.com/placeholder' : 'https://t.me/placeholder', '_blank')}>
                                            Join {formData.profileData?.socialGroup === 'whatsapp' ? 'WhatsApp' : 'Telegram'} Group
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Rewards & Feedback</CardTitle>
                                <CardDescription>Tell us what you like.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>What would you like to win?</Label>
                                    <Select
                                        value={formData.profileData?.rewardPreference || ''}
                                        onValueChange={(val) => handleUpdate('rewardPreference', {
                                            profileData: { ...formData.profileData, rewardPreference: val }
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select reward type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="prizes">Prizes</SelectItem>
                                            <SelectItem value="points">Points</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Feedback</Label>
                                    <Textarea placeholder="Tell us what you think..." />
                                    <Button variant="outline" size="sm" className="mt-2">Send Feedback</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
