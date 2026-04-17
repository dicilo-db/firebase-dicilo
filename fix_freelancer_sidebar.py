import re

filepath = "src/components/dashboard/freelancer/FreelancerSidebar.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add import
if "NativeBookingDialog" not in content:
    content = content.replace("import { Button } from '@/components/ui/button';", "import { Button } from '@/components/ui/button';\nimport NativeBookingDialog from '@/components/shared/NativeBookingDialog';")

# Add to navItems
nav_item_insertion = """        {
            id: 'recommend_company',
            label: t('freelancer_menu.new_recommendation', 'Nueva Recomendación'),
            icon: Building2
        },
        {
            id: 'contact',
            label: t('dashboard.contact', 'Contactar al Team Dicilo'),
            icon: HelpCircle,
            isContact: True
        }"""
content = content.replace("""        {
            id: 'recommend_company',
            label: t('freelancer_menu.new_recommendation', 'Nueva Recomendación'),
            icon: Building2
        }""", nav_item_insertion)

# Fix rendering
old_render = """                                    <button
                                        onClick={() => handleNavigation(item.id)}
                                        className={cn(
                                            "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                            isActive ? "bg-accent text-accent-foreground" : "transparent",
                                            item.isHeading && "hover:bg-transparent cursor-default mt-4 mb-1 px-0"
                                        )}
                                        disabled={item.isHeading}
                                    >
                                        <div className="flex items-center">
                                            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                            <span className={cn(item.isHeading && "font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider")}>
                                                {item.label}
                                            </span>
                                        </div>
                                        {hasChildren && (
                                            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>"""

new_render = """                                    {item.isContact ? (
                                        <NativeBookingDialog trigger={
                                            <button
                                                className={cn(
                                                    "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors transparent"
                                                )}
                                            >
                                                <div className="flex items-center">
                                                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                                    <span>{item.label}</span>
                                                </div>
                                            </button>
                                        } />
                                    ) : (
                                        <button
                                            onClick={() => handleNavigation(item.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                                                isActive ? "bg-accent text-accent-foreground" : "transparent",
                                                item.isHeading && "hover:bg-transparent cursor-default mt-4 mb-1 px-0"
                                            )}
                                            disabled={item.isHeading}
                                        >
                                            <div className="flex items-center">
                                                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                                <span className={cn(item.isHeading && "font-bold text-slate-900 dark:text-slate-100 uppercase text-[11px] tracking-wider")}>
                                                    {item.label}
                                                </span>
                                            </div>
                                            {hasChildren && (
                                                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}"""

# Use simple replace for a long chunk, might fail if whitespace differs slightly
# I'll use regex or multi_replace_file_content if this fails.

with open("fix_freelancer.py", "w") as script:
    script.write("""
import os, sys
with open('src/components/dashboard/freelancer/FreelancerSidebar.tsx', 'r') as f:
    text = f.read()

if 'NativeBookingDialog' not in text:
    text = text.replace("import { Button } from '@/components/ui/button';", "import { Button } from '@/components/ui/button';\\nimport NativeBookingDialog from '@/components/shared/NativeBookingDialog';")

if "isContact: true" not in text:
    text = text.replace('''        {
            id: 'recommend_company',
            label: t('freelancer_menu.new_recommendation', 'Nueva Recomendación'),
            icon: Building2
        }''', '''        {
            id: 'recommend_company',
            label: t('freelancer_menu.new_recommendation', 'Nueva Recomendación'),
            icon: Building2
        },
        {
            id: 'contact',
            label: t('dashboard.contact', 'Contactar al Team Dicilo'),
            icon: HelpCircle,
            isContact: true
        }''')

find_str = '''                                    <button
                                        onClick={() => handleNavigation(item.id)}'''
replace_str = '''                                    {item.isContact ? (
                                        <NativeBookingDialog trigger={
                                            <button
                                                className={cn(
                                                    "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors transparent"
                                                )}
                                            >
                                                <div className="flex items-center">
                                                    {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                                                    <span>{item.label}</span>
                                                </div>
                                            </button>
                                        } />
                                    ) : (
                                        <button
                                            onClick={() => handleNavigation(item.id)}'''

text = text.replace(find_str, replace_str)

text = text.replace('''                                        </button>

                                    {/* Children (Sub-menu) */}''', '''                                        </button>
                                    )}

                                    {/* Children (Sub-menu) */}''')

with open('src/components/dashboard/freelancer/FreelancerSidebar.tsx', 'w') as f:
    f.write(text)
""")
