with open("src/app/admin/dashboard/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_replacement = """import {
  Building,
  DatabaseZap,
  Loader2,
  Users,
  LayoutTemplate,
  DollarSign,
  MessageSquare,
  RefreshCw,
  BarChartHorizontal,
  FileText,
  DownloadCloud,
  Star,
  UserCheck,
  ThumbsUp,
  User,
  Bot,
  Tag,
  Coins,
  Wallet,
  Briefcase,
  Megaphone,
  Scan,
  LifeBuoy,
  Globe,
  Mail,
  Ticket,
  Settings,
  ShieldAlert,
  CalendarCheck2
} from 'lucide-react';"""
content = content.replace("import {\n  Building,", import_replacement.replace("import {\n  Building,", "import {\n  Building,"), 1)

# we will insert the two new cards right below Governance Global

old_gov = """            {/* Acceso Directo al Nuevo Panel Empresarial Aislado */}
            <Link href="/admin/dashboard-empresarial" className="group lg:col-span-2 xl:col-span-1">
              <Card className="h-full bg-slate-900 border-slate-800 transition-all hover:shadow-xl hover:border-primary cursor-pointer relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-bold text-slate-200">Gobernanza Global</CardTitle>
                  <Settings className="h-4 w-4 text-primary group-hover:rotate-90 transition-transform duration-500" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-black">Panel Empresarial</div>
                  <p className="text-xs text-slate-400 mt-1">Gestor Maestro de Fichas y Módulos</p>
                </CardContent>
              </Card>
            </Link>"""

new_cards = """            {/* Acceso Directo al Nuevo Panel Empresarial Aislado */}
            <Link href="/admin/dashboard-empresarial" className="group lg:col-span-2 xl:col-span-1">
              <Card className="h-full bg-slate-900 border-slate-800 transition-all hover:shadow-xl hover:border-primary cursor-pointer relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-bold text-slate-200">Gobernanza Global</CardTitle>
                  <Settings className="h-4 w-4 text-primary group-hover:rotate-90 transition-transform duration-500" />
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-black">Panel Empresarial</div>
                  <p className="text-xs text-slate-400 mt-1">Gestor Maestro de Fichas y Módulos</p>
                </CardContent>
              </Card>
            </Link>

            {/* Omnichannel Inbox Direct Link (NEW) */}
            <Link href="/dashboard/business/crm/inbox" className="group">
              <Card className="h-full bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 transition-all hover:shadow-md hover:border-blue-600 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400">Team Office CRM</CardTitle>
                  <MessageSquare className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">Bandeja Unificada</div>
                  <p className="text-xs text-muted-foreground mt-1">Chat Central (WhatsApp/Tel/Web)</p>
                </CardContent>
              </Card>
            </Link>

            {/* Master Calendar Direct Link (NEW) */}
            <Link href="/dashboard/business/crm/calendar" className="group">
              <Card className="h-full bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 transition-all hover:shadow-md hover:border-emerald-600 cursor-pointer relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Team Office CRM</CardTitle>
                  <CalendarCheck2 className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">Calendario Maestro</div>
                  <p className="text-xs text-muted-foreground mt-1">Reservas Centralizadas Calendly</p>
                </CardContent>
              </Card>
            </Link>"""

content = content.replace(old_gov, new_cards)

with open("src/app/admin/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

