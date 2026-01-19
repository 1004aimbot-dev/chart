import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, CheckCircle, XCircle, Clock, FileText, Save, Edit2 } from 'lucide-react';
import { getOrgUnitsByType, getOrgMembers, updateMemberInOrg } from '../api/org_api';
import { parsePosition } from '../utils/memberParser';
import { getAttendanceByDate, upsertAttendance } from '../api/attendance_api';
import type { Member, OrgUnit } from '../api/org_api';
import type { AttendanceRecord } from '../api/attendance_api';

export default function AttendanceView() {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [choirs, setChoirs] = useState<OrgUnit[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');
    const [members, setMembers] = useState<Member[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
    const [loading, setLoading] = useState(false);

    // Memo State
    const [openMemoId, setOpenMemoId] = useState<string | null>(null);
    const [memoText, setMemoText] = useState('');

    // Initial Load: Get Choirs
    useEffect(() => {
        async function fetchChoirs() {
            try {
                // Fetch both 'choir' and 'team' types as they might be used for communities
                const choirsData = await getOrgUnitsByType('choir');
                const teamsData = await getOrgUnitsByType('team');
                setChoirs([...choirsData, ...teamsData]);

                if (choirsData.length > 0) {
                    setSelectedOrgId(choirsData[0].id);
                } else if (teamsData.length > 0) {
                    setSelectedOrgId(teamsData[0].id);
                }
            } catch (err) {
                console.error(err);
            }
        }
        fetchChoirs();
    }, []);

    // Load Members and Attendance when Org or Date changes
    useEffect(() => {
        if (!selectedOrgId) return;

        async function fetchData() {
            setLoading(true);
            try {
                // 1. Get Members
                const membersData = await getOrgMembers(selectedOrgId);
                setMembers(membersData);

                // 2. Get Attendance
                const attendanceData = await getAttendanceByDate(selectedOrgId, selectedDate);
                const map: Record<string, AttendanceRecord> = {};
                attendanceData.forEach(r => {
                    map[r.member_id] = r;
                });
                setAttendanceMap(map);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
        fetchData();
    }, [selectedOrgId, selectedDate]);

    const handleStatusChange = async (memberId: string, status: 'present' | 'absent' | 'late') => {
        // Optimistic update
        const prevRecord = attendanceMap[memberId];
        const newRecord: AttendanceRecord = {
            ...prevRecord,
            org_unit_id: selectedOrgId,
            member_id: memberId,
            date: selectedDate,
            status: status
        };

        setAttendanceMap(prev => ({ ...prev, [memberId]: newRecord }));

        try {
            await upsertAttendance(newRecord);
        } catch (err) {
            console.error(err);
            alert('저장 실패!');
            // Revert
            if (prevRecord) {
                setAttendanceMap(prev => ({ ...prev, [memberId]: prevRecord }));
            }
        }
    };

    const handleMemoSave = async (memberId: string) => {
        const record = attendanceMap[memberId];
        // If no status yet, default to present or just save note? 
        // Let's assume we need a status to save a record. Default to 'present' if new.
        const status = record?.status || 'present';

        const newRecord: AttendanceRecord = {
            ...record,
            org_unit_id: selectedOrgId,
            member_id: memberId,
            date: selectedDate,
            status: status,
            note: memoText
        };

        try {
            await upsertAttendance(newRecord);
            setAttendanceMap(prev => ({ ...prev, [memberId]: newRecord }));
            setOpenMemoId(null);
            setMemoText('');
        } catch (err) {
            console.error(err);
            alert('메모 저장 실패');
        }
    };

    const toggleMemo = (memberId: string) => {
        if (openMemoId === memberId) {
            setOpenMemoId(null);
            setMemoText('');
        } else {
            setOpenMemoId(memberId);
            setMemoText(attendanceMap[memberId]?.note || '');
        }
    };

    // Name & Position Edit Logic
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ name: '', position: '' });

    const startEditing = (member: Member) => {
        setEditingMemberId(member.id);
        setEditData({ name: member.name, position: member.position || '' });
    };

    const saveEdit = async (member: Member) => {
        if (!editData.name.trim()) return;
        try {
            await updateMemberInOrg(selectedOrgId, member.id, {
                name: editData.name,
                position: editData.position
            });

            // Update local state
            setMembers(prev => prev.map(m => m.id === member.id ? {
                ...m,
                name: editData.name,
                position: editData.position
            } : m));
            setEditingMemberId(null);
        } catch (err: any) {
            console.error(err);
            alert('수정 실패: ' + err.message);
        }
    };

    // Stats
    const stats = {
        total: members.length,
        present: Object.values(attendanceMap).filter(s => s.status === 'present').length,
        absent: Object.values(attendanceMap).filter(s => s.status === 'absent').length,
        late: Object.values(attendanceMap).filter(s => s.status === 'late').length,
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800">
                <div className="flex items-center gap-2">
                    <Calendar className="text-blue-400" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="font-bold text-lg bg-transparent outline-none cursor-pointer text-white"
                    />
                </div>

                <select
                    value={selectedOrgId}
                    onChange={e => setSelectedOrgId(e.target.value)}
                    className="w-full md:w-64 px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">조직 선택</option>
                    {choirs.map(c => (
                        <option key={c.id} value={c.id}>{c.name.replace(/.*\((.*)\)/, '$1')}</option>
                    ))}
                </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-2 md:gap-4">
                <div className="bg-slate-900 p-3 md:p-4 rounded-xl shadow-sm border border-slate-800 text-center">
                    <div className="text-slate-400 text-xs md:text-sm mb-1">전체</div>
                    <div className="text-xl md:text-2xl font-bold text-white">{stats.total}</div>
                </div>
                <div className="bg-blue-500/10 p-3 md:p-4 rounded-xl shadow-sm border border-blue-500/20 text-center">
                    <div className="text-blue-400 text-xs md:text-sm mb-1">출석</div>
                    <div className="text-xl md:text-2xl font-bold text-blue-400">{stats.present}</div>
                </div>
                <div className="bg-red-500/10 p-3 md:p-4 rounded-xl shadow-sm border border-red-500/20 text-center">
                    <div className="text-red-400 text-xs md:text-sm mb-1">결석</div>
                    <div className="text-xl md:text-2xl font-bold text-red-500">{stats.absent}</div>
                </div>
                <div className="bg-orange-500/10 p-3 md:p-4 rounded-xl shadow-sm border border-orange-500/20 text-center">
                    <div className="text-orange-400 text-xs md:text-sm mb-1">지각</div>
                    <div className="text-xl md:text-2xl font-bold text-orange-500">{stats.late}</div>
                </div>
            </div>

            {/* Member List */}
            <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="text-center py-10 text-slate-500">데이터를 불러오는 중...</div>
                ) : members.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        {selectedOrgId ? '등록된 성도가 없습니다.' : '조직을 선택해주세요.'}
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-800">
                        {members.map(member => {
                            const record = attendanceMap[member.id];
                            const status = record?.status;
                            const hasNote = record?.note && record.note.length > 0;

                            return (
                                <li key={member.id} className="p-4 flex flex-col gap-3 hover:bg-slate-800/30 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Profile Info */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                {editingMemberId === member.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            value={editData.name}
                                                            onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                                                            className="bg-slate-800 border border-blue-500 text-white px-2 py-0.5 rounded focus:outline-none w-24"
                                                            placeholder="이름"
                                                            autoFocus
                                                            onKeyDown={e => e.key === 'Enter' && saveEdit(member)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                        <input
                                                            value={editData.position}
                                                            onChange={e => setEditData(prev => ({ ...prev, position: e.target.value }))}
                                                            className="bg-slate-800 border border-slate-600 focus:border-blue-500 text-slate-200 px-2 py-0.5 rounded focus:outline-none w-28 text-sm"
                                                            placeholder="직책"
                                                            onKeyDown={e => e.key === 'Enter' && saveEdit(member)}
                                                            onClick={e => e.stopPropagation()}
                                                        />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); saveEdit(member); }}
                                                            className="text-blue-500 hover:text-blue-400 p-1"
                                                        >
                                                            <Save size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 group/name">
                                                        <span
                                                            className="font-bold text-lg text-white cursor-pointer hover:text-blue-200 transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); startEditing(member); }}
                                                        >
                                                            {member.name.replace(/.*\((.*)\)/, '$1')}
                                                        </span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); startEditing(member); }}
                                                            className="opacity-0 group-hover/name:opacity-100 text-slate-500 hover:text-blue-400 transition-all p-1"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </div>
                                                )}

                                                {member.position && (() => {
                                                    const { part, job } = parsePosition(member.position);
                                                    return (
                                                        <div className="flex items-center gap-1" onClick={(e) => { e.stopPropagation(); startEditing(member); }}>
                                                            {part && (
                                                                <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full cursor-pointer hover:border-blue-500/50 hover:text-blue-300 transition-colors">
                                                                    {part}
                                                                </span>
                                                            )}
                                                            {job && (
                                                                <span className="text-xs bg-slate-900 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded-full cursor-pointer hover:border-blue-500/50 hover:text-blue-300 transition-colors">
                                                                    {job}
                                                                </span>
                                                            )}
                                                            {!part && !job && (
                                                                <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full cursor-pointer hover:border-blue-500/50 hover:text-blue-300 transition-colors">
                                                                    {member.position}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                {hasNote && (
                                                    <span className="text-xs text-yellow-500 flex items-center gap-0.5" title={record.note}>
                                                        <FileText size={12} />
                                                        메모
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-slate-500">{member.role === 'leader' ? '임원' : ''}</div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button
                                                onClick={() => handleStatusChange(member.id, 'present')}
                                                className={`flex-1 md:flex-none flex items-center justify-center gap-1 px-2 py-3 md:py-2 rounded-lg font-medium transition-all whitespace-nowrap ${status === 'present'
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                                                    }`}
                                            >
                                                <CheckCircle size={18} />
                                                <span>출석</span>
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(member.id, 'late')}
                                                className={`flex-1 md:flex-none flex items-center justify-center gap-1 px-2 py-3 md:py-2 rounded-lg font-medium transition-all whitespace-nowrap ${status === 'late'
                                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                                                    }`}
                                            >
                                                <Clock size={18} />
                                                <span>지각</span>
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(member.id, 'absent')}
                                                className={`flex-1 md:flex-none flex items-center justify-center gap-1 px-2 py-3 md:py-2 rounded-lg font-medium transition-all whitespace-nowrap ${status === 'absent'
                                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                                                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                                                    }`}
                                            >
                                                <XCircle size={18} />
                                                <span>결석</span>
                                            </button>
                                            <button
                                                onClick={() => toggleMemo(member.id)}
                                                className={`px-3 py-2 rounded-lg transition-all ${hasNote ? 'text-yellow-400 bg-yellow-500/20' : 'text-slate-500 bg-slate-800 hover:bg-slate-700 hover:text-slate-300'
                                                    }`}
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Memo Expand */}
                                    {openMemoId === member.id && (
                                        <div className="animate-in slide-in-from-top-2 duration-200">
                                            <div className="flex gap-2">
                                                <input
                                                    value={memoText}
                                                    onChange={e => setMemoText(e.target.value)}
                                                    placeholder="비고/특이사항 입력..."
                                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    autoFocus
                                                    onKeyDown={e => e.key === 'Enter' && handleMemoSave(member.id)}
                                                />
                                                <button
                                                    onClick={() => handleMemoSave(member.id)}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
                                                >
                                                    <Save size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
