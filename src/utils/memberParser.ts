export const PARTS = ['소프라노', '알토', '테너', '베이스'];
export const JOBS = ['부위원장', '위원장', '부장', '차장', '파트장', '솔리스트', '대장', '지휘자', '반주자', '총무', '회계', '서기', '대원'];

export function parsePosition(position: string | undefined | null) {
    if (!position) return { part: '', job: '' };

    const part = PARTS.find(p => position.includes(p)) || '';
    const job = JOBS.find(j => position.includes(j)) || '';

    // If there is leftover text that isn't part or job, we might want to know, 
    // but for now let's just extract what we know.
    // Ideally, if 'Unknown' is there, it might be treated as a job or part or just ignored/displayed as raw.
    // For this specific request, we just want to separate these known tokens.

    // If neither found, return raw position as job for fallback?
    // Or if only one found, logic depends.
    // Let's stick to the logic used in OrgDetailPanel previously.

    return { part, job };
}

export function formatPosition(part: string, job: string) {
    return [part, job].filter(Boolean).join(' ');
}
