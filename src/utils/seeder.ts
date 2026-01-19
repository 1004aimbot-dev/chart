import { supabase } from '../lib/supabase';

const CHOIRS = ['글로리아', '임마누엘', '갈릴리'];
const PRAISE_TEAMS = ['찬양단 1', '찬양단 2', '찬양단 3'];


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

    // Add Vice Chairman
    const viceLeaderId = crypto.randomUUID();
    membersToCreate.push({
        id: viceLeaderId,
        name: `Sample Vice Chairman`,
        role: 'member'
    });

    // Add membership for leader
    // (Note: The original code didn't add membership for the leader in step 64! Ideally it should have.)
    // Let's modify to insert membership for the singular leader and this new vice chairman into the LAST unit generated.

    // Actually, looking at original code, it PUSHES only to membersToCreate in lines 60-63.
    // It does NOT create membership for the leader?! 
    // That's a bug in the existing seeder too, or maybe leader is just a member role type.
    // Let's just follow the pattern but ensure we create a MEMBERSHIP so they appear in the organization unit.

    // We need a unit ID. Let's use the first unit.
    if (units.length > 0) {
        membershipsToCreate.push({
            member_id: leaderId,
            org_unit_id: units[0].id,
            position: '위원장'
        });
        membershipsToCreate.push({
            member_id: viceLeaderId,
            org_unit_id: units[0].id,
            position: '부위원장'
        });
    }

    const { error: membersError } = await supabase.from('members').insert(membersToCreate);
    if (membersError) console.error('Error creating members:', membersError);

    const { error: shipError } = await supabase.from('memberships').insert(membershipsToCreate);
    if (shipError) console.error('Error creating memberships:', shipError);

    // 4. Create Janghohoe (Root)
    const { error: jangError } = await supabase
        .from('org_units')
        .insert({ name: '장호회', type: 'root' });
    if (jangError) console.error('Error creating Janghohoe:', jangError);



    console.log('Seeding complete!');
    alert('Seeding complete! Refresh the page.');
}
