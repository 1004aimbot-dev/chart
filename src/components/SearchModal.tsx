import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Phone } from 'lucide-react';
import { searchMembers } from '../api/org_api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: Props) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 1) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const data = await searchMembers(val);
            setResults(data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const handleNavigate = (orgId: string) => {
        onClose();
        navigate(`/org?unitId=${orgId}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex gap-3 items-center">
                <Search className="text-slate-400" size={20} />
                <input
                    className="flex-1 text-lg outline-none placeholder:text-slate-500 bg-transparent text-white"
                    placeholder="성도 이름 검색..."
                    value={query}
                    onChange={e => handleSearch(e.target.value)}
                    autoFocus
                />
                <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-8 text-slate-500">검색 중...</div>
                ) : results.length > 0 ? (
                    <ul className="space-y-3">
                        {results.map(member => (
                            <li key={member.id} className="bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-100 text-lg flex items-center gap-2 font-serif">
                                        {member.name}
                                    </h4>
                                    {member.phone && (
                                        <a href={`tel:${member.phone}`} className="text-blue-400 bg-blue-500/10 p-2 rounded-full hover:bg-blue-500/20 transition-colors">
                                            <Phone size={16} />
                                        </a>
                                    )}
                                </div>

                                {member.affiliations && member.affiliations.length > 0 ? (
                                    <div className="space-y-2">
                                        {member.affiliations.map((aff: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleNavigate(aff.orgId)}
                                                className="w-full text-left text-sm text-slate-400 flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 transition-colors group"
                                            >
                                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full group-hover:bg-blue-400 transition-colors"></span>
                                                <span className="font-medium text-slate-300 group-hover:text-blue-300 transition-colors">{aff.orgName}</span>
                                                {aff.position && (
                                                    <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-xs border border-blue-500/20">
                                                        {aff.position}
                                                    </span>
                                                )}
                                                <span className="ml-auto text-xs text-slate-600 group-hover:text-slate-400">
                                                    바로가기 →
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600">소속 정보 없음</p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : query.length > 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        검색 결과가 없습니다.
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-700 flex flex-col items-center gap-3">
                        <Search size={48} className="opacity-20" />
                        <p>이름을 입력하여 검색하세요</p>
                    </div>
                )}
            </div>
        </div>
    );
}
