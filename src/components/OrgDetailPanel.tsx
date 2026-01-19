import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrgMembers, createMemberInOrg, removeMemberFromOrg, updateMemberInOrg } from '../api/org_api';
import type { Member, OrgUnit } from '../api/org_api';
import { parsePosition } from '../utils/memberParser';
import { UserPlus, Phone, X, Edit2, Save } from 'lucide-react';

import { supabase } from '../lib/supabase';

interface Props {
    orgUnit: OrgUnit;
    onClose: () => void;
}

export default function OrgDetailPanel({ orgUnit, onClose }: Props) {
    const { isAdmin } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [part, setPart] = useState('');
    const [jobTitle, setJobTitle] = useState('');

    useEffect(() => {
        loadMembers();
        resetForm();

        // Realtime Subscription
        const channel = supabase
            .channel('org-members-sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'memberships',
                    filter: `org_unit_id=eq.${orgUnit.id}`
                },
                () => {
                    loadMembers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [orgUnit.id]);

    const resetForm = () => {
        setName('');
        setPhone('');
        setPart('');
        setJobTitle('');
        setShowAddForm(false);
        setEditingMemberId(null);
    };

    const loadMembers = async () => {
        setLoading(true);
        const data = await getOrgMembers(orgUnit.id);
        setMembers(data);
        setLoading(false);
    };

    const handleEditClick = (member: Member) => {
        setName(member.name);
        setPhone(member.phone || '');

        // Split position back to part and jobTitle if possible
        // Split position back to part and jobTitle if possible
        const pos = member.position || '';

        const { part: foundPart, job: foundJob } = parsePosition(pos);

        setPart(foundPart);
        setJobTitle(foundJob);

        setEditingMemberId(member.id);
        setShowAddForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return alert('이름을 입력해주세요.');

        // Combine part and jobTitle
        const position = [part, jobTitle].filter(Boolean).join(' ');

        try {
            if (editingMemberId) {
                await updateMemberInOrg(orgUnit.id, editingMemberId, { name, phone, position });
                alert('수정되었습니다.');
            } else {
                await createMemberInOrg(orgUnit.id, { name, phone, position });
                alert('성도가 등록되었습니다.');
            }
            resetForm();
            loadMembers();
        } catch (error: any) {
            alert((editingMemberId ? '수정' : '등록') + ' 실패: ' + error.message);
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!confirm(`${memberName}님을 명단에서 삭제하시겠습니까?`)) return;

        try {
            await removeMemberFromOrg(orgUnit.id, memberId);
            alert('삭제되었습니다.');
            loadMembers();
        } catch (error: any) {
            alert('삭제 실패: ' + error.message);
        }
    };

    return (
        <div className="bg-slate-900 border-l border-slate-800 h-full flex flex-col w-full md:w-96 fixed md:static inset-y-0 right-0 z-10 shadow-xl md:shadow-none animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <div>
                    <h3 className="font-bold text-lg text-white font-serif">{orgUnit.name.replace(/.*\((.*)\)/, '$1')}</h3>
                    <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {orgUnit.type}
                    </span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                {/* Composition Stats */}
                {!loading && members.length > 0 && (
                    <div className="mb-6 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                        {orgUnit.type === 'choir' || orgUnit.type === 'team' ? (
                            <div className="grid grid-cols-4 gap-2 text-center">
                                {['소프라노', '알토', '테너', '베이스'].map(partName => {
                                    const count = members.filter(m => (m.position || '').includes(partName)).length;
                                    return (
                                        <div key={partName} className="flex flex-col">
                                            <span className="text-[11px] text-slate-400 uppercase">{partName}</span>
                                            <span className={`font-bold ${count > 0 ? 'text-blue-400' : 'text-slate-600'}`}>{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-center">
                                {['위원장', '부위원장', '부장', '차장', '회계', '서기', '대원'].map(targetJob => {
                                    const count = members.filter(m => {
                                        const { job } = parsePosition(m.position);
                                        return job === targetJob;
                                    }).length;

                                    if (count === 0) return null;
                                    return (
                                        <div key={targetJob} className="flex gap-1.5 items-center">
                                            <span className="text-[10px] text-slate-400">{targetJob}</span>
                                            <span className="text-sm font-bold text-blue-400">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Add/Edit Form Toggle */}
                {!showAddForm ? (
                    isAdmin && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 mb-6"
                        >
                            <UserPlus size={20} />
                            새 성도 등록하기
                        </button>
                    )
                ) : (
                    <form onSubmit={handleSubmit} className="bg-slate-800/50 p-4 rounded-xl mb-6 space-y-3 border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-white text-sm">
                                {editingMemberId ? '정보 수정' : '새 성도 등록'}
                            </h4>
                            <button type="button" onClick={resetForm} className="text-slate-500 hover:text-slate-300">
                                <X size={16} />
                            </button>
                        </div>
                        <input
                            className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="이름 (필수)"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />

                        <div className="flex gap-2">
                            <select
                                className="w-1/2 px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={part}
                                onChange={e => setPart(e.target.value)}
                            >
                                <option value="">파트 선택</option>
                                <option value="소프라노">소프라노</option>
                                <option value="알토">알토</option>
                                <option value="테너">테너</option>
                                <option value="베이스">베이스</option>
                            </select>

                            <select
                                className="w-1/2 px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={jobTitle}
                                onChange={e => setJobTitle(e.target.value)}
                            >
                                <option value="">직책 선택</option>
                                <option value="위원장">위원장</option>
                                <option value="부위원장">부위원장</option>
                                <option value="부장">부장</option>
                                <option value="차장">차장</option>
                                <option value="파트장">파트장</option>
                                <option value="솔리스트">솔리스트</option>
                                <option value="대장">대장</option>
                                <option value="지휘자">지휘자</option>
                                <option value="반주자">반주자</option>
                                <option value="총무">총무</option>
                                <option value="회계">회계</option>
                                <option value="서기">서기</option>
                                <option value="대원">대원</option>
                            </select>
                        </div>

                        <input
                            className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="전화번호 (선택)"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                        />
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-blue-900/20">
                            {editingMemberId ? <Save size={16} /> : <UserPlus size={16} />}
                            {editingMemberId ? '수정 완료' : '등록 완료'}
                        </button>
                    </form>
                )}

                {/* Member List */}
                <div className="space-y-4">
                    <h4 className="font-bold text-slate-200 flex items-center gap-2">
                        구성원 <span className="text-slate-500 font-normal text-sm">{members.length}명</span>
                    </h4>

                    {loading ? (
                        <div className="text-center py-8 text-slate-500 text-sm">로딩 중...</div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-sm bg-slate-800/30 rounded-lg border border-slate-800">
                            등록된 인원이 없습니다.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-800">
                            {members.map(member => (
                                <li key={member.id} className="py-3 flex justify-between items-start group hover:bg-slate-800/50 -mx-2 px-2 rounded-lg transition-colors">
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-200 flex items-center gap-2">
                                            {member.name.replace(/.*\((.*)\)/, '$1')}
                                            {member.position && (() => {
                                                const { part, job } = parsePosition(member.position);
                                                return (
                                                    <div className="flex gap-1">
                                                        {part && (
                                                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                                                {part}
                                                            </span>
                                                        )}
                                                        {job && (
                                                            <span className="text-[10px] text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                                {job}
                                                            </span>
                                                        )}
                                                        {!part && !job && (
                                                            <span className="text-[10px] text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                                {member.position}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        {member.phone && (
                                            <div className="text-sm text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                                <Phone size={14} />
                                                {member.phone}
                                            </div>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditClick(member)}
                                                className="text-slate-500 hover:text-blue-400 p-1.5 hover:bg-blue-500/10 rounded transition-colors"
                                                title="수정"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.name)}
                                                className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded transition-colors"
                                                title="삭제"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
