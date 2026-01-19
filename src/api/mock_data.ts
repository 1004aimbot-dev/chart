export const MOCK_ORG_TREE = [
    {
        id: 'root',
        name: '성남신광교회',
        type: 'root',
        children: [
            {
                id: 'choir-gloria',
                name: '글로리아 찬양대',
                type: 'choir',
                children: []
            },
            {
                id: 'choir-immanuel',
                name: '임마누엘 찬양대',
                type: 'choir',
                children: []
            },
            {
                id: 'choir-galilee',
                name: '갈릴리 찬양대',
                type: 'choir',
                children: []
            },
            {
                id: 'team-1',
                name: '찬양단 1',
                type: 'team',
                children: []
            },
            {
                id: 'team-2',
                name: '찬양단 2',
                type: 'team',
                children: []
            },
            {
                id: 'team-3',
                name: '찬양단 3',
                type: 'team',
                children: []
            }
        ]
    }
];

export const MOCK_MEMBERS = [
    { id: 'm1', name: '김철수', org_id: 'choir-gloria', role: 'member', position: 'Bass' },
    { id: 'm2', name: '이영희', org_id: 'choir-gloria', role: 'member', position: 'Soprano' },
    { id: 'm3', name: '박민수', org_id: 'choir-immanuel', role: 'leader', position: 'Conductor' },
    { id: 'm4', name: '최지우', org_id: 'choir-galilee', role: 'member', position: 'Alto' },
];
