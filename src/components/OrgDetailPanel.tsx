import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getOrgMembers, createMemberInOrg, removeMemberFromOrg, updateMemberInOrg, updateOrgUnit } from '../api/org_api';
import type { Member, OrgUnit } from '../api/org_api';
import { parsePosition } from '../utils/memberParser';
import { UserPlus, Phone, X, Edit2, Save, Cake } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

import { supabase } from '../lib/supabase';

interface Props {
    orgUnit: OrgUnit;
    onClose: () => void;
    onOrgUpdate?: () => void;
}

export default function OrgDetailPanel({ orgUnit, onClose, onOrgUpdate }: Props) {
    const { isAdmin } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Confirm Modal State
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState<{ id: string, name: string } | null>(null);

    // Org Edit State
    const [isEditingOrg, setIsEditingOrg] = useState(false);
    const [editOrgType, setEditOrgType] = useState(orgUnit.type);

    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [part, setPart] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [birthday, setBirthday] = useState('');

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

    // Update edit state when orgUnit changes
    useEffect(() => {
        setEditOrgType(orgUnit.type);
        setIsEditingOrg(false);
    }, [orgUnit]);

    const handleUpdateOrgType = async () => {
        try {
            await updateOrgUnit(orgUnit.id, { name: orgUnit.name, type: editOrgType });
            setIsEditingOrg(false);
            if (onOrgUpdate) onOrgUpdate();
            // Optimistic update for UI if needed, but tree refresh is better
        } catch (error) {
            console.error('Failed to update org type:', error);
            alert('조직 정보 수정 실패');
        }
    };

    const resetForm = () => {
        setName('');
        setPhone('');
        setPart('');
        setJobTitle('');
        setBirthday('');
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
        setBirthday(member.birthday || '');

        setEditingMemberId(member.id);
        setShowAddForm(true);
        // Scroll to top so user sees the form
        setTimeout(() => {
            scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        // Combine part and jobTitle
        const position = [part, jobTitle].filter(Boolean).join(' ');

        try {
            if (editingMemberId) {
                await updateMemberInOrg(orgUnit.id, editingMemberId, { name, phone, position, birthday });
                alert('수정되었습니다.');
            } else {
                await createMemberInOrg(orgUnit.id, { name, phone, position, birthday });
                alert('성도가 등록되었습니다.');
            }
            resetForm();
            loadMembers();
        } catch (error: any) {
            console.error('Save Error:', error);
            const msg = error.message || '저장 중 오류가 발생했습니다.';
            alert('저장 실패: ' + msg);
        } finally {
            setSubmitting(false);
        }
    };

    const requestDeleteMember = (e: React.MouseEvent, memberId: string, memberName: string) => {
        e.stopPropagation();
        setConfirmModalData({ id: memberId, name: memberName });
        setConfirmModalOpen(true);
    };

    const confirmDeleteMember = async () => {
        if (!confirmModalData) return;

        try {
            await removeMemberFromOrg(orgUnit.id, confirmModalData.id);
            // alert('삭제되었습니다.'); // Optional: remove alert for smoother UX
            loadMembers();
        } catch (error: any) {
            alert('삭제 실패: ' + error.message);
        } finally {
            setConfirmModalOpen(false);
            setConfirmModalData(null);
        }
    };

    return (
        <div className="bg-slate-900 border-l border-slate-800 h-full flex flex-col w-full md:w-96 fixed md:static inset-y-0 right-0 z-10 shadow-xl md:shadow-none animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white font-serif">{orgUnit.name}</h2>

                        {isEditingOrg ? (
                            <div className="flex items-center gap-2 mt-2">
                                <select
                                    value={editOrgType}
                                    onChange={(e) => setEditOrgType(e.target.value as any)}
                                    className="bg-slate-800 text-white text-sm rounded border border-slate-600 px-2 py-1"
                                >
                                    <option value="root">Root (최상위)</option>
                                    <option value="committee">Committee (위원회)</option>
                                    <option value="department">Department (부서)</option>
                                    <option value="team">Team (팀)</option>
                                    <option value="choir">Choir (찬양대/단)</option>
                                </select>
                                <button onClick={handleUpdateOrgType} className="p-1 bg-blue-600 text-white rounded hover:bg-blue-500"><Save size={14} /></button>
                                <button onClick={() => setIsEditingOrg(false)} className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"><X size={14} /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-700 text-slate-300 rounded uppercase tracking-wider">
                                    {orgUnit.type}
                                </span>
                                {isAdmin && (
                                    <button
                                        onClick={() => setIsEditingOrg(true)}
                                        className="text-slate-500 hover:text-blue-400 p-0.5 rounded transition-colors"
                                        title="조직 타입 수정"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-4 custom-scrollbar"
            >

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

                        <input
                            className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="생일 (예: 08.15)"
                            value={birthday}
                            onChange={e => setBirthday(e.target.value)}
                        />

                        <button
                            type="submit"
                            disabled={!name.trim() || submitting}
                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 shadow-lg ${!name.trim() || submitting
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none'
                                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20'
                                }`}
                        >
                            {submitting ? (
                                <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full block" />
                            ) : (
                                editingMemberId ? <Save size={16} /> : <UserPlus size={16} />
                            )}
                            {submitting
                                ? '처리 중...'
                                : (editingMemberId ? '수정 완료' : '등록 완료')
                            }
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
                                <li key={member.id} className="py-3 flex justify-between items-start group hover:bg-slate-800/50 -mx-2 px-3 rounded-lg transition-colors">
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
                                            {member.birthday && (
                                                <div className="flex items-center gap-1 text-[11px] text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20">
                                                    <Cake size={10} />
                                                    {member.birthday}
                                                </div>
                                            )}
                                        </div>
                                        {member.phone && (
                                            <div className="text-sm text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                                <Phone size={14} />
                                                {member.phone}
                                            </div>
                                        )}
                                    </div>
                                    {isAdmin && (
                                        <div className="flex gap-1 transition-opacity relative z-10 flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditClick(member);
                                                }}
                                                className="text-slate-500 hover:text-blue-400 p-1.5 hover:bg-blue-500/10 rounded transition-colors"
                                                title="수정"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => requestDeleteMember(e, member.id, member.name)}
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

            <ConfirmModal
                isOpen={confirmModalOpen}
                title="성도 삭제"
                message={`${confirmModalData?.name}님을 명단에서 삭제하시겠습니까?`}
                onConfirm={confirmDeleteMember}
                onCancel={() => setConfirmModalOpen(false)}
                confirmText="삭제"
                isDanger={true}
            />
        </div >
    );
}
