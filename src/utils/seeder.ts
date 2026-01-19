import { supabase } from '../lib/supabase';

const CHOIRS = ['Gloria (글로리아)', 'Immanuel (임마누엘)', 'Galilee (갈릴리)'];
const PRAISE_TEAMS = ['Praise Team 1 (찬양단 1)', 'Praise Team 2 (찬양단 2)', 'Praise Team 3 (찬양단 3)'];

export async function seedDatabase() {
    console.log('Starting seed...');

    // 1. Create Root Org
    const { data: root, error: rootError } = await supabase
        .from('org_units')
        .insert({ name: 'Seongnam Shinkwang Church', type: 'root' })
        .select()
        .single();

    if (rootError) {
        console.error('Error creating root:', rootError);
        throw new Error('Root Org Create Failed: ' + rootError.message);
    }

    // 2. Create Choirs and Praise Teams
    const unitsToCreate = [
        ...CHOIRS.map(name => ({ name, type: 'choir', parent_id: root.id })),
        ...PRAISE_TEAMS.map(name => ({ name, type: 'team', parent_id: root.id }))
    ];

    const { data: units, error: unitsError } = await supabase
        .from('org_units')
        .insert(unitsToCreate)
        .select();

    if (unitsError) {
        console.error('Error creating units:', unitsError);
        return;
    }

    // 3. Create Dummy Members
    const membersToCreate = [];
    const membershipsToCreate = [];

    for (const unit of units) {
        for (let i = 1; i <= 5; i++) {
            const memberId = crypto.randomUUID();
            membersToCreate.push({
                id: memberId,
                name: `${unit.name} Member ${i}`,
                role: 'member'
            });
            membershipsToCreate.push({
                member_id: memberId,
                org_unit_id: unit.id,
                position: 'Singer'
            });
        }
    }

    // Add Leader
    const leaderId = crypto.randomUUID();
    membersToCreate.push({
        id: leaderId,
        name: `Choir Leader User`,
        role: 'leader'
    });

    const { error: membersError } = await supabase.from('members').insert(membersToCreate);
    if (membersError) console.error('Error creating members:', membersError);

    const { error: shipError } = await supabase.from('memberships').insert(membershipsToCreate);
    if (shipError) console.error('Error creating memberships:', shipError);

    console.log('Seeding complete!');
    alert('Seeding complete! Refresh the page.');
}
