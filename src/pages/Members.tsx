import { useEffect, useState } from 'react';
import { getOrgUnitsByType, getOrgMembers } from '../api/org_api';
import { parsePosition } from '../utils/memberParser';
import type { OrgUnit } from '../api/org_api';

interface ChoirStat {
    id: string;
    name: string;
    soprano: number;
    alto: number;
    tenor: number;
    bass: number;
    total: number;
}

export default function Members() {
    const [stats, setStats] = useState<ChoirStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch choirs and teams
            const [choirs, teams] = await Promise.all([
                getOrgUnitsByType('choir'),
                getOrgUnitsByType('team')
            ]);

            const allUnits = [...(choirs || []), ...(teams || [])];

            // 2. Fetch members for each unit and calculate stats
            const statsPromises = allUnits.map(async (unit: OrgUnit) => {
                const members = await getOrgMembers(unit.id);

                let soprano = 0;
                let alto = 0;
                let tenor = 0;
                let bass = 0;

                members.forEach(m => {
                    const { part } = parsePosition(m.position);
                    if (part === '소프라노') soprano++;
                    else if (part === '알토') alto++;
                    else if (part === '테너') tenor++;
                    else if (part === '베이스') bass++;
                });

                return {
                    id: unit.id,
                    name: unit.name,
                    soprano,
                    alto,
                    tenor,
                    bass,
                    total: members.length
                };
            });

            const results = await Promise.all(statsPromises);
            setStats(results);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white font-serif">인원구성</h2>
            </div>

            <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">
                        로딩 중...
                    </div>
                ) : stats.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        등록된 찬양대/단이 없습니다.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                    <th className="p-4 font-medium">찬양대/단</th>
                                    <th className="p-4 font-medium text-center">소프라노</th>
                                    <th className="p-4 font-medium text-center">알토</th>
                                    <th className="p-4 font-medium text-center">테너</th>
                                    <th className="p-4 font-medium text-center">베이스</th>
                                    <th className="p-4 font-medium text-center">총원</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {stats.map(choir => (
                                    <tr key={choir.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 font-bold text-white">{choir.name}</td>
                                        <td className="p-4 text-center">
                                            {choir.soprano > 0 ? (
                                                <span className="text-blue-400 font-medium">{choir.soprano}</span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {choir.alto > 0 ? (
                                                <span className="text-blue-400 font-medium">{choir.alto}</span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {choir.tenor > 0 ? (
                                                <span className="text-blue-400 font-medium">{choir.tenor}</span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {choir.bass > 0 ? (
                                                <span className="text-blue-400 font-medium">{choir.bass}</span>
                                            ) : (
                                                <span className="text-slate-600">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center font-bold text-white bg-slate-800/30">
                                            {choir.total}
                                        </td>
                                    </tr>
                                ))}
                                {/* Grand Total Row */}
                                <tr className="bg-slate-900/80 font-bold border-t-2 border-slate-700">
                                    <td className="p-4 text-white">합계</td>
                                    <td className="p-4 text-center text-blue-300">
                                        {stats.reduce((acc, curr) => acc + curr.soprano, 0)}
                                    </td>
                                    <td className="p-4 text-center text-blue-300">
                                        {stats.reduce((acc, curr) => acc + curr.alto, 0)}
                                    </td>
                                    <td className="p-4 text-center text-blue-300">
                                        {stats.reduce((acc, curr) => acc + curr.tenor, 0)}
                                    </td>
                                    <td className="p-4 text-center text-blue-300">
                                        {stats.reduce((acc, curr) => acc + curr.bass, 0)}
                                    </td>
                                    <td className="p-4 text-center text-white bg-slate-800/50">
                                        {stats.reduce((acc, curr) => acc + curr.total, 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
