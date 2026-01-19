import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getOrgTree, createOrgUnit, deleteOrgUnit, updateOrgUnit } from '../api/org_api';
import type { OrgUnit } from '../api/org_api';
import { Users, ChevronRight, ChevronDown, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import OrgDetailPanel from '../components/OrgDetailPanel';

export default function OrgChart() {
    const [searchParams] = useSearchParams();
    const [tree, setTree] = useState<OrgUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState<OrgUnit | null>(null);

    useEffect(() => {
        loadTree();
    }, []);

    // Effect to handle deep linking via ?unitId=...
    useEffect(() => {
        const unitId = searchParams.get('unitId');
        if (unitId && tree.length > 0) {
            const found = findUnitRecursive(tree, unitId);
            if (found) {
                setSelectedUnit(found);
            }
        }
    }, [searchParams, tree]);

    const findUnitRecursive = (nodes: OrgUnit[], id: string): OrgUnit | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findUnitRecursive(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const loadTree = async () => {
        try {
            const data = await getOrgTree();
            setTree(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRoot = async () => {
        const name = prompt('새로운 최상위 조직의 이름을 입력하세요:');
        if (!name) return;
        try {
            await createOrgUnit({ name, type: 'root', parent_id: null });
            loadTree();
        } catch (error: any) {
            alert('생성 실패: ' + error.message);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">조직도를 불러오는 중...</div>;

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 overflow-hidden relative">
            {/* Left: Tree View */}
            <div className={`flex-1 flex flex-col space-y-4 transition-all duration-300 w-full ${selectedUnit ? 'md:w-2/3' : 'md:w-full'}`}>
                <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100 font-serif">조직도</h2>
                        <p className="text-sm text-slate-400">조직을 클릭하여 구성원을 관리하세요.</p>
                    </div>
                    <button
                        onClick={handleAddRoot}
                        className="flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                    >
                        <Plus size={18} />
                        <span className="font-medium whitespace-nowrap">최상위 조직 추가</span>
                    </button>
                </div>

                <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 flex-1 overflow-y-auto custom-scrollbar">
                    {tree.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 gap-4">
                            <Users size={48} className="text-slate-700" />
                            <p>등록된 조직 데이터가 없습니다.</p>
                            <button onClick={handleAddRoot} className="text-blue-400 underline hover:text-blue-300">첫 조직 만들기</button>
                        </div>
                    ) : (
                        tree.map(node => (
                            <OrgNode
                                key={node.id}
                                node={node}
                                level={0}
                                onSelect={setSelectedUnit}
                                selectedId={selectedUnit?.id}
                                onRefresh={loadTree}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Right: Detail Panel */}
            {selectedUnit && (
                <div className="w-full md:w-96 flex-shrink-0 animate-in slide-in-from-right duration-300 z-20 absolute inset-0 md:static">
                    <OrgDetailPanel
                        orgUnit={selectedUnit}
                        onClose={() => setSelectedUnit(null)}
                    />
                </div>
            )}
        </div>
    );
}

interface OrgNodeProps {
    node: OrgUnit;
    level: number;
    onSelect: (node: OrgUnit) => void;
    selectedId?: string;
    onRefresh: () => void;
}

function OrgNode({ node, level, onSelect, selectedId, onRefresh }: OrgNodeProps) {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(node.name);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleAddChild = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const name = prompt(`${node.name} 아래에 추가할 하위 조직 이름:`);
        if (!name) return;

        // Simple type inference (optional improvement later)
        let type = 'department';
        if (node.type === 'root') type = 'committee';
        if (node.type === 'committee') type = 'department';
        if (node.type === 'department') type = 'team';

        try {
            await createOrgUnit({ name, type, parent_id: node.id });
            setIsOpen(true);
            onRefresh();
        } catch (err: any) {
            alert('추가 실패: ' + err.message);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`'${node.name}' 조직을 삭제하시겠습니까?\n하위 조직도 모두 연결이 끊기거나 삭제될 수 있습니다.`)) return;
        try {
            await deleteOrgUnit(node.id);
            onSelect(null as any); // Deselect
            onRefresh();
        } catch (err: any) {
            alert('삭제 실패: ' + err.message);
        }
    };

    const handleUpdate = async (e: React.MouseEvent) => {
        e.stopPropagation(); // prevent select
        try {
            await updateOrgUnit(node.id, { name: editName });
            setIsEditing(false);
            onRefresh();
        } catch (err: any) {
            alert('수정 실패: ' + err.message);
        }
    };

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all group ${isSelected ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'hover:bg-slate-800 border-transparent'
                    } ${level === 0 ? 'mb-2' : 'mb-1'}`}
                style={{ marginLeft: `${level * 20}px` }}
                onClick={() => !isEditing && onSelect(node)}
            >
                {/* Toggle Icon */}
                <div
                    onClick={handleToggle}
                    className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                    {hasChildren && (isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />)}
                </div>

                {/* Icon */}
                <div className={`p-2 border rounded-md shadow-sm transition-colors ${isSelected
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-white group-hover:border-slate-500 group-hover:bg-slate-700'
                    }`}>
                    <Users size={18} />
                </div>

                {/* Name / Edit Input */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="px-2 py-1 text-base bg-slate-800 border border-blue-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-auto min-w-[120px]"
                                autoFocus
                            />
                            <button onClick={handleUpdate} className="p-1 text-green-400 hover:bg-green-500/20 rounded"><Check size={16} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditName(node.name); }} className="p-1 text-red-400 hover:bg-red-500/20 rounded"><X size={16} /></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${isSelected ? 'text-slate-900' : 'text-slate-100'} ${level === 0 ? 'text-xl' : 'text-base'}`}>
                                {node.name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${isSelected
                                ? 'bg-blue-100 border-blue-200 text-blue-700'
                                : 'bg-slate-800 border-slate-600 text-slate-400'
                                }`}>
                                {node.type}
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions (Hover only or Always on Edit) */}
                <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isEditing ? 'hidden' : ''}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded"
                        title="이름 수정"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={handleAddChild}
                        className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded"
                        title="하위 조직 추가"
                    >
                        <Plus size={14} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                        title="삭제"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {isOpen && hasChildren && (
                <div className="mt-1 relative">
                    {/* Line Guide (Optional UI polish) 
                    <div className="absolute left-[calc(level*24px)+10px] top-0 bottom-0 w-px bg-gray-200"></div>
                    */}
                    {node.children!.map(child => (
                        <OrgNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                            onRefresh={onRefresh}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
