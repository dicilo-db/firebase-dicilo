import re

filepath = "src/components/shared/NativeBookingDialog.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update the fetch call
old_submit = """        try {
            await addDoc(collection(db, 'crm_appointments'), {
                title: `Asesoría B2B: ${formData.name}`,
                date: selectedTimeSlot.toISOString(), // Standard UTC String
                duration: 30, // minutes
                status: 'pending',
                client_name: formData.name,
                client_phone: formData.whatsapp,
                client_reason: formData.reason,
                source: 'native_web_booking',
                created_at: new Date().toISOString()
            });
            setSuccess(true);
            setStep(3); // Success Screen
        } catch (error) {"""

new_submit = """        try {
            const res = await fetch('/api/bookings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedTimeSlot.toISOString(),
                    client_name: formData.name,
                    client_phone: formData.whatsapp,
                    client_reason: formData.reason
                })
            });
            if (!res.ok) throw new Error("API Route Failed");
            setSuccess(true);
            setStep(3); // Success Screen
        } catch (error) {"""

content = content.replace(old_submit, new_submit)

# 2. Update timezone rendering block
old_tz_block = """                                <div className="flex items-center gap-3">
                                    <Globe2 className="w-5 h-5 text-blue-400" />
                                    <span>Zona Horaria:<br/><span className="text-xs text-slate-400 font-normal">{userTz}</span></span>
                                </div>"""

new_tz_block = """                                <div className="flex items-center gap-3">
                                    <Globe2 className="w-5 h-5 text-blue-400" />
                                    <span>
                                        Tú: Zona horaria<br/>
                                        <span className="text-xs text-slate-400 font-normal">{userTz}</span>
                                    </span>
                                </div>"""

content = content.replace(old_tz_block, new_tz_block)

# 3. Update the selected time rendering block "17:00. Berlin"
old_selected_block = """                        {selectedDate && selectedTimeSlot && (
                            <div className="mt-8 bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Cita Seleccionada</p>
                                <p className="text-emerald-400 font-semibold">{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</p>
                                <p className="text-white font-bold text-xl">{timeSlots.find(s => s.date.getTime() === selectedTimeSlot.getTime())?.localStr}</p>
                            </div>
                        )}"""

new_selected_block = """                        {selectedDate && selectedTimeSlot && (
                            <div className="mt-8 bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Cita Seleccionada</p>
                                <p className="text-emerald-400 font-semibold">{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</p>
                                <p className="text-white font-bold text-xl">{timeSlots.find(s => s.date.getTime() === selectedTimeSlot.getTime())?.localStr}</p>
                                <p className="text-slate-400 text-sm">{timeSlots.find(s => s.date.getTime() === selectedTimeSlot.getTime())?.berlinStr} Berlín</p>
                            </div>
                        )}"""

content = content.replace(old_selected_block, new_selected_block)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

