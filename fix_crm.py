with open("src/app/dashboard/business/crm/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_replacement = """import { BriefcaseBusiness, Users, ReceiptText, Plus, ArrowRight, Calendar, MessageSquare } from 'lucide-react';
import Link from 'next/link';"""

content = content.replace("import { BriefcaseBusiness, Users, ReceiptText, Kanavel as Kanban, Plus, ArrowRight } from 'lucide-react';", import_replacement)

# Button 1: Inbox
old_inbox_btn = """                    <Button variant="outline" className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center justify-center gap-2">
                        {t('business.crm.manageLeadsBtn', 'Ver Directorio de Clientes')} <ArrowRight className="w-4 h-4" />
                    </Button>"""

new_inbox_btn = """                    <Link href="/dashboard/business/crm/inbox" passHref>
                        <Button variant="outline" className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center justify-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Entrar a Bandeja Omnicanal <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>"""
content = content.replace(old_inbox_btn, new_inbox_btn)

# Kanban title replace
content = content.replace("{t('business.crm.kanbanTitle', 'Panel de Estado de Cotizaciones')}", "{t('business.crm.kanbanTitle', 'Calendario Central de Operaciones')}")
content = content.replace("{t('business.crm.kanbanDesc', 'Mueve tus cotizaciones: Borrador -> Enviada -> Aceptada.')}", "Visualiza citas de Calendly y reuniones en tiempo real sincronizado con Google.")

old_kanban_btn = """                    <Button variant="outline" className="w-full text-slate-700 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2">
                        {t('business.crm.openKanbanBtn', 'Abrir Panel de Cierres')} <ArrowRight className="w-4 h-4" />
                    </Button>"""

new_kanban_btn = """                    <Link href="/dashboard/business/crm/calendar" passHref>
                        <Button variant="outline" className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4" /> Abrir Calendario Maestro <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>"""
content = content.replace(old_kanban_btn, new_kanban_btn)

with open("src/app/dashboard/business/crm/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

