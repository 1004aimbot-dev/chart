export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            org_units: {
                Row: {
                    id: string
                    name: string
                    parent_id: string | null
                    type: 'root' | 'committee' | 'department' | 'team' | 'choir'
                    leader_member_id: string | null
                    sort_order: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    parent_id?: string | null
                    type?: 'root' | 'committee' | 'department' | 'team' | 'choir'
                    leader_member_id?: string | null
                    sort_order?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    parent_id?: string | null
                    type?: 'root' | 'committee' | 'department' | 'team' | 'choir'
                    leader_member_id?: string | null
                    sort_order?: number | null
                    created_at?: string
                }
            }
            members: {
                Row: {
                    id: string
                    name: string
                    phone: string | null
                    role: 'admin' | 'leader' | 'member'
                    role_title: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone?: string | null
                    role?: 'admin' | 'leader' | 'member'
                    role_title?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string | null
                    role?: 'admin' | 'leader' | 'member'
                    role_title?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            memberships: {
                Row: {
                    id: string
                    member_id: string
                    org_unit_id: string
                    position: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    member_id: string
                    org_unit_id: string
                    position?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    member_id?: string
                    org_unit_id?: string
                    position?: string | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            attendance: {
                Row: {
                    id: string
                    org_unit_id: string
                    member_id: string
                    date: string
                    status: 'present' | 'absent' | 'late'
                    note: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    org_unit_id: string
                    member_id: string
                    date: string
                    status: 'present' | 'absent' | 'late'
                    note?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    org_unit_id?: string
                    member_id?: string
                    date?: string
                    status?: 'present' | 'absent' | 'late'
                    note?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
