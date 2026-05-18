'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    UserCircle, 
    PackageSearch, 
    Ticket, 
    BarChart3, 
    Settings,
    Mail,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Resumen', href: '/business/dashboard', icon: LayoutDashboard },
    { name: 'Mi Perfil', href: '/business/profile', icon: UserCircle },
    { name: 'Gestor de Productos', href: '/business/products', icon: PackageSearch },
    { name: 'Cupones', href: '/business/coupons', icon: Ticket },
    { name: 'Recomendaciones', href: '/business/recommendations', icon: MapPin },
    { name: 'Newsletter', href: '/business/newsletter', icon: Mail },
    { name: 'Estadísticas', href: '/business/stats', icon: BarChart3 },
    { name: 'Configuración', href: '/business/settings', icon: Settings },
];

export function BusinessSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-r min-h-screen flex-shrink-0 hidden md:flex flex-col dark:bg-slate-950 dark:border-slate-800">
            <div className="h-16 flex items-center px-6 border-b dark:border-slate-800">
                <span className="font-bold text-xl text-blue-600 dark:text-blue-400">Dicilo Business</span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    isActive
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
                                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        isActive ? 'text-blue-700 dark:text-blue-200' : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300',
                                        'mr-3 flex-shrink-0 h-5 w-5'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            
            <div className="p-4 border-t dark:border-slate-800">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center dark:bg-slate-800">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">B2B</span>
                        </div>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Panel Empresa</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Versión B2B</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
