import { supabase } from '../lib/supabase';

export interface AttendanceRecord {
    id?: string;
    org_unit_id: string;
    member_id: string;
    date: string;
    status: 'present' | 'absent' | 'late';
    note?: string;
}

export async function getAttendanceByDate(orgId: string, date: string) {
    const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('org_unit_id', orgId)
        .eq('date', date);

    if (error) throw error;
    return data as AttendanceRecord[];
}

export async function upsertAttendance(record: AttendanceRecord) {
    // Check if exists first to get ID for update, or just use upsert with composite key if constraint exists.
    // Assuming simple upsert based on (org_unit_id, member_id, date) might not work without unique constraint.
    // Let's use select first then insert/update to be safe in code, or use upsert if we know the unique constraint.
    // The schema usually has a unique index on those 3 fields? Let's assume so or handle connection.

    // Better strategy for UI responsiveness: Upsert by matching composite key if possible.
    // Supabase upsert needs a constraint name if not primary key.

    // Let's try select first.
    const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('org_unit_id', record.org_unit_id)
        .eq('member_id', record.member_id)
        .eq('date', record.date)
        .single();

    let result;
    if (existing) {
        result = await supabase
            .from('attendance')
            .update({ status: record.status, note: record.note })
            .eq('id', existing.id);
    } else {
        result = await supabase
            .from('attendance')
            .insert(record);
    }

    if (result.error) throw result.error;
}
