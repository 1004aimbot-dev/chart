import { supabase } from '../lib/supabase';

export interface OrgUnit {
    id: string;
    name: string;
    type: 'root' | 'committee' | 'department' | 'team' | 'choir';
    parent_id: string | null;
    children?: OrgUnit[];
}

export async function getOrgCounts() {
    const { count, error } = await supabase
        .from('org_units')
        .select('*', { count: 'exact', head: true });

    if (error) console.error('Error fetching org count:', error);
    return count || 0;
}

export async function getOrgTree(): Promise<OrgUnit[]> {
    const { data, error } = await supabase
        .from('org_units')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching org tree:', error);
        return [];
    }

    // Build Tree
    const units = (data || []) as OrgUnit[];
    const map = new Map<string, OrgUnit>();
    const roots: OrgUnit[] = [];

    units.forEach(unit => {
        unit.children = [];
        map.set(unit.id, unit);
    });

    units.forEach(unit => {
        if (unit.parent_id) {
            const parent = map.get(unit.parent_id);
            if (parent) {
                parent.children?.push(unit);
            }
        } else {
            roots.push(unit);
        }
    });

    return roots;
}

export async function getOrgUnitsByType(type: string) {
    const { data, error } = await supabase
        .from('org_units')
        .select('*')
        .eq('type', type)
        .order('sort_order', { ascending: true });

    if (error) throw error;
    if (error) throw error;
    return data;
}

export async function createOrgUnit(data: { name: string; type: string; parent_id: string | null; sort_order?: number }) {
    const { data: newOrg, error } = await supabase
        .from('org_units')
        .insert(data)
        .select()
        .single();

    if (error) throw error;
    return newOrg;
}

export async function deleteOrgUnit(id: string) {
    // Note: Database should handle cascade delete if configured, otherwise we might need to manual check.
    // Assuming user knows they are deleting a tree node.
    const { error } = await supabase
        .from('org_units')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function updateOrgUnit(id: string, data: { name: string; type?: string }) {
    const { error } = await supabase
        .from('org_units')
        .update(data)
        .eq('id', id);

    if (error) throw error;
}

export interface Member {
    id: string;
    name: string;
    phone: string | null;
    role: 'member' | 'leader' | 'admin';
    position?: string; // stored in memberships.position
}

export async function getOrgMembers(orgId: string): Promise<Member[]> {
    const { data, error } = await supabase
        .from('memberships')
        .select(`
            position,
            member:members (
                id,
                name,
                phone,
                role
            )
        `)
        .eq('org_unit_id', orgId)
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching members:', error);
        return [];
    }

    return data.map((item: any) => ({
        ...item.member,
        position: item.position
    })).sort((a: any, b: any) => a.name.localeCompare(b.name, 'ko'));
}

export async function createMemberInOrg(
    orgId: string,
    memberData: { name: string; phone?: string; position?: string }
) {
    // 1. Create Member
    const { data: member, error: memberError } = await supabase
        .from('members')
        .insert({
            name: memberData.name,
            phone: memberData.phone,
            role: 'member'
        })
        .select()
        .single();

    if (memberError) throw memberError;

    // 2. Link to Org (Membership)
    const { error: linkError } = await supabase
        .from('memberships')
        .insert({
            member_id: member.id,
            org_unit_id: orgId,
            position: memberData.position
        });

    if (linkError) throw linkError;

    return member;
}

export async function removeMemberFromOrg(orgId: string, memberId: string) {
    const { error } = await supabase
        .from('memberships')
        .delete()
        .match({ org_unit_id: orgId, member_id: memberId });

    if (error) throw error;
}

export async function updateMemberInOrg(
    orgId: string,
    memberId: string,
    data: { name: string; phone?: string; position?: string }
) {
    // 1. Update Member Info
    const { error: memberError } = await supabase
        .from('members')
        .update({
            name: data.name,
            phone: data.phone
        })
        .eq('id', memberId);

    if (memberError) throw memberError;

    // 2. Update Position (Membership)
    const { error: linkError } = await supabase
        .from('memberships')
        .update({
            position: data.position
        })
        .match({ org_unit_id: orgId, member_id: memberId });

    if (linkError) throw linkError;
}

export async function searchMembers(query: string) {
    const { data, error } = await supabase
        .from('members')
        .select(`
            id,
            name,
            phone,
            role,
            memberships (
                position,
                org_units (
                    id,
                    name,
                    type
                )
            )
        `)
        .ilike('name', `%${query}%`)
        .limit(10);

    if (error) throw error;

    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        role: item.role,
        affiliations: item.memberships.map((m: any) => ({
            orgId: m.org_units.id,
            orgName: m.org_units.name,
            position: m.position
        }))
    }));
}
