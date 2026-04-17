with open("src/app/dashboard/business/layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_statement = """import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';"""

content = content.replace("import { Skeleton } from '@/components/ui/skeleton';", import_statement)

old_return = """    return (
        <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            <div className="h-full hidden md:block z-10 shrink-0">
                <BusinessSidebar plan={plan} email={email} isLoading={false} />
            </div>

            <div className="flex-1 h-full overflow-y-auto w-full relative">
                {children}
            </div>
        </div>
    );"""

new_return = """    return (
        <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            {/* Desktop Sidebar */}
            <div className="h-full hidden md:block z-10 shrink-0">
                <BusinessSidebar plan={plan} email={email} isLoading={false} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-0">
                {/* Mobile Header (Only visible on small screens) */}
                <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shrink-0 z-20">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dicilo<span className="text-blue-600">Business</span></h2>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <Menu className="h-5 w-5 text-slate-700" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64 border-r-0">
                            <BusinessSidebar plan={plan} email={email} isLoading={false} />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Sub-Pages Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );"""

content = content.replace(old_return, new_return)

with open("src/app/dashboard/business/layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

