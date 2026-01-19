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

interface CommitteeStat {
    id: string;
    name: string;
    chairman: number; // 위원장
    viceChairman: number; // 부위원장
    manager: number; // 부장
    deputy: number; // 차장
    treasurer: number; // 회계
    clerk: number; // 서기
    total: number;
}

export default function Members() {
    const [choirStats, setChoirStats] = useState<ChoirStat[]>([]);
    const [committeeStats, setCommitteeStats] = useState<CommitteeStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all types
            const [choirs, teams, committees] = await Promise.all([
                getOrgUnitsByType('choir'),
                getOrgUnitsByType('team'),
                getOrgUnitsByType('committee')
            ]);

            // 2. Categorize Units
            // "Music" units: type is choir/team OR name contains "찬양단"
            const allCommittees = committees || [];
            const musicCommitees = allCommittees.filter(c => c.name.includes('찬양단'));
            const adminCommittees = allCommittees.filter(c => !c.name.includes('찬양단'));

            const musicUnits = [
                ...(choirs || []),
                ...(teams || []),
                ...musicCommitees
            ];

            // Remove duplicates by ID
            const uniqueMusicUnits = Array.from(new Map(musicUnits.map(item => [item.id, item])).values());

            // 3. Process Music Stats (Parts)
            const musicPromises = uniqueMusicUnits.map(async (unit: OrgUnit) => {
                const members = await getOrgMembers(unit.id);
                let soprano = 0, alto = 0, tenor = 0, bass = 0;
                members.forEach(m => {
                    const { part } = parsePosition(m.position);
                    if (part === '소프라노') soprano++;
                    else if (part === '알토') alto++;
                    else if (part === '테너') tenor++;
                    else if (part === '베이스') bass++;
                });
                return {
                    id: unit.id, name: unit.name,
                    soprano, alto, tenor, bass, total: members.length
                };
            });

            // 4. Process Committee Stats (Roles)
            const committeePromises = adminCommittees.map(async (unit: OrgUnit) => {
                const members = await getOrgMembers(unit.id);
                let chairman = 0, viceChairman = 0, manager = 0, deputy = 0, treasurer = 0, clerk = 0;

                members.forEach(m => {
                    const { job } = parsePosition(m.position);
                    if (job === '위원장') chairman++;
                    else if (job === '부위원장') viceChairman++;
                    else if (job === '부장') manager++;
                    else if (job === '차장') deputy++;
                    else if (job === '회계') treasurer++;
                    else if (job === '서기') clerk++;
                });

                return {
                    id: unit.id, name: unit.name,
                    chairman, viceChairman, manager, deputy, treasurer, clerk, total: members.length
                };
            });

            const [musicResults, committeeResults] = await Promise.all([
                Promise.all(musicPromises),
                Promise.all(committeePromises)
            ]);

            setChoirStats(musicResults);
            setCommitteeStats(committeeResults);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white font-serif">인원구성</h2>

            {/* Choir/Team Table */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-300 border-l-4 border-blue-500 pl-3">찬양대 / 찬양단</h3>
                <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">로딩 중...</div>
                    ) : choirStats.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">등록된 찬양대/단이 없습니다.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                        <th className="p-4 font-medium">이름</th>
                                        <th className="p-4 font-medium text-center">소프라노</th>
                                        <th className="p-4 font-medium text-center">알토</th>
                                        <th className="p-4 font-medium text-center">테너</th>
                                        <th className="p-4 font-medium text-center">베이스</th>
                                        <th className="p-4 font-medium text-center">총원</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {choirStats.map(stat => (
                                        <tr key={stat.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-bold text-white">{stat.name}</td>
                                            <td className="p-4 text-center">{stat.soprano > 0 ? <span className="text-blue-400 font-medium">{stat.soprano}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center">{stat.alto > 0 ? <span className="text-blue-400 font-medium">{stat.alto}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center">{stat.tenor > 0 ? <span className="text-blue-400 font-medium">{stat.tenor}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center">{stat.bass > 0 ? <span className="text-blue-400 font-medium">{stat.bass}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center font-bold text-white bg-slate-800/30">{stat.total}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-900/80 font-bold border-t-2 border-slate-700">
                                        <td className="p-4 text-white">합계</td>
                                        <td className="p-4 text-center text-blue-300">{choirStats.reduce((acc, curr) => acc + curr.soprano, 0)}</td>
                                        <td className="p-4 text-center text-blue-300">{choirStats.reduce((acc, curr) => acc + curr.alto, 0)}</td>
                                        <td className="p-4 text-center text-blue-300">{choirStats.reduce((acc, curr) => acc + curr.tenor, 0)}</td>
                                        <td className="p-4 text-center text-blue-300">{choirStats.reduce((acc, curr) => acc + curr.bass, 0)}</td>
                                        <td className="p-4 text-center text-white bg-slate-800/50">{choirStats.reduce((acc, curr) => acc + curr.total, 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Committee Table */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-300 border-l-4 border-green-500 pl-3">위원회</h3>
                <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">로딩 중...</div>
                    ) : committeeStats.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">등록된 위원회가 없습니다.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                        <th className="p-4 font-medium">위원회명</th>
                                        <th className="p-4 font-medium text-center">위원장</th>
                                        <th className="p-4 font-medium text-center">부위원장</th>
                                        <th className="p-4 font-medium text-center">부장</th>
                                        <th className="p-4 font-medium text-center">차장</th>
                                        <th className="p-4 font-medium text-center">회계</th>
                                        <th className="p-4 font-medium text-center">서기</th>
                                        <th className="p-4 font-medium text-center">총원</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-slate-300">
                                    {committeeStats.map(stat => (
                                        <tr key={stat.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-bold text-white">{stat.name}</td>
                                            <td className="p-4 text-center">{stat.chairman > 0 ? <span className="text-green-400 font-medium">{stat.chairman}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center">{stat.viceChairman > 0 ? <span className="text-green-400 font-medium">{stat.viceChairman}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center">{stat.manager > 0 ? <span className="text-green-400 font-medium">{stat.manager}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center">{stat.deputy > 0 ? <span className="text-green-400 font-medium">{stat.deputy}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center">{stat.treasurer > 0 ? <span className="text-green-400 font-medium">{stat.treasurer}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center">{stat.clerk > 0 ? <span className="text-green-400 font-medium">{stat.clerk}</span> : <span className="text-slate-600">-</span>}</td>
                                            <td className="p-4 text-center font-bold text-white bg-slate-800/30">{stat.total}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-900/80 font-bold border-t-2 border-slate-700">
                                        <td className="p-4 text-white">합계</td>
                                        <td className="p-4 text-center text-green-300">{committeeStats.reduce((acc, curr) => acc + curr.chairman, 0)}</td>
                                        <td className="p-4 text-center text-green-300">{committeeStats.reduce((acc, curr) => acc + curr.viceChairman, 0)}</td>
                                        <td className="p-4 text-center text-green-300">{committeeStats.reduce((acc, curr) => acc + curr.manager, 0)}</td>
                                        <td className="p-4 text-center text-green-300">{committeeStats.reduce((acc, curr) => acc + curr.deputy, 0)}</td>
                                        <td className="p-4 text-center text-green-300">{committeeStats.reduce((acc, curr) => acc + curr.treasurer, 0)}</td>
                                        <td className="p-4 text-center text-green-300">{committeeStats.reduce((acc, curr) => acc + curr.clerk, 0)}</td>
                                        <td className="p-4 text-center text-white bg-slate-800/50">{committeeStats.reduce((acc, curr) => acc + curr.total, 0)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
