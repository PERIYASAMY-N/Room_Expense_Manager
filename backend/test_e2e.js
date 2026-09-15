const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`);
    }
    return data;
}

async function runTests() {
    console.log('Starting E2E Tests...');
    try {
        // 1. AUTHENTICATION (Register 4 users)
        const users = ['Karthi', 'Navi', 'Kadhir', 'Naveen'].map(name => ({
            username: name.toLowerCase() + Date.now(),
            fullName: name,
            password: 'password123',
            phone: '1234567890'
        }));
        
        const tokens = {};
        const userIds = {};

        for (const u of users) {
            const res = await request('/auth/register', 'POST', u);
            tokens[u.fullName] = res.token;
            // We can get profile
            const profile = await request('/auth/me', 'GET', null, res.token);
            userIds[u.fullName] = profile.id;
            console.log(`Registered ${u.fullName} with ID ${profile.id}`);
        }

        console.log('✅ AUTHENTICATION PASS');

        // 2. CREATE ROOM
        const roomRes = await request('/rooms', 'POST', { roomName: 'Naga Nalu Peru' }, tokens['Karthi']);
        const roomId = roomRes.id;
        const roomDetails = await request(`/rooms/${roomId}`, 'GET', null, tokens['Karthi']);
        const inviteCode = roomDetails.invite_code;
        
        console.log(`Room created: ID ${roomId}, Invite: ${inviteCode}`);
        console.log('✅ CREATE ROOM PASS');

        // 3. JOIN ROOM
        for (const name of ['Navi', 'Kadhir', 'Naveen']) {
            await request('/rooms/join', 'POST', { code: inviteCode }, tokens[name]);
            console.log(`${name} joined room`);
        }
        
        const members = await request(`/rooms/${roomId}/members`, 'GET', null, tokens['Karthi']);
        assert.strictEqual(members.length, 4, 'Room should have 4 members');
        
        const memberIds = {};
        members.forEach(m => {
            memberIds[m.full_name] = m.user_id;
        });

        console.log('✅ JOIN ROOM PASS');

        // 4. ADD EXPENSE 1 (Karthi pays 300, participants: Karthi, Navi, Kadhir)
        await request(`/rooms/${roomId}/expenses`, 'POST', {
            title: 'Coffee',
            category: 'Food',
            expenseDate: new Date().toISOString().split('T')[0],
            payers: [{ userId: memberIds['Karthi'], amount: 300 }],
            participants: [memberIds['Karthi'], memberIds['Navi'], memberIds['Kadhir']],
            items: [{ name: 'Coffee', amount: 300 }]
        }, tokens['Karthi']);
        
        console.log('Added Expense 1 (Coffee, 300)');

        // VERIFY CALCULATION 1
        let recommendations = await request(`/rooms/${roomId}/settlements/recommendations`, 'GET', null, tokens['Karthi']);
        
        // Find Navi -> Karthi 100
        let naviToKarthi = recommendations.find(r => r.fromName === 'Navi' && r.toName === 'Karthi');
        let kadhirToKarthi = recommendations.find(r => r.fromName === 'Kadhir' && r.toName === 'Karthi');
        let naveenToKarthi = recommendations.find(r => r.fromName === 'Naveen' && r.toName === 'Karthi');
        
        assert(naviToKarthi && naviToKarthi.amount === 100, 'Navi should owe Karthi 100');
        assert(kadhirToKarthi && kadhirToKarthi.amount === 100, 'Kadhir should owe Karthi 100');
        assert(!naveenToKarthi, 'Naveen should not owe anything');
        
        console.log('✅ EXPENSE 1 & PAIRWISE NETTING PASS');

        // 5. ADD EXPENSE 2 (Naveen pays 400, participants: all 4)
        await request(`/rooms/${roomId}/expenses`, 'POST', {
            title: 'Food',
            category: 'Food',
            expenseDate: new Date().toISOString().split('T')[0],
            payers: [{ userId: memberIds['Naveen'], amount: 400 }],
            participants: [memberIds['Karthi'], memberIds['Navi'], memberIds['Kadhir'], memberIds['Naveen']],
            items: [{ name: 'Food', amount: 400 }]
        }, tokens['Naveen']);
        
        console.log('Added Expense 2 (Food, 400)');

        recommendations = await request(`/rooms/${roomId}/settlements/recommendations`, 'GET', null, tokens['Karthi']);
        
        // At this point:
        // Navi -> Karthi 100
        // Kadhir -> Karthi 100
        // Karthi -> Naveen 100
        // Navi -> Naveen 100
        // Kadhir -> Naveen 100

        // In global greedy, Navi (owes 200) would pay Naveen directly. Let's see if pairwise is preserved.
        let karthiToNaveen = recommendations.find(r => r.fromName === 'Karthi' && r.toName === 'Naveen');
        let naviToNaveen = recommendations.find(r => r.fromName === 'Navi' && r.toName === 'Naveen');
        
        assert(karthiToNaveen && karthiToNaveen.amount === 100, 'Karthi should owe Naveen 100');
        assert(naviToNaveen && naviToNaveen.amount === 100, 'Navi should owe Naveen 100');
        
        // Karthi is a creditor to Navi/Kadhir, but debtor to Naveen. Global greedy would collapse this.
        assert(recommendations.find(r => r.fromName === 'Navi' && r.toName === 'Karthi'), 'Pairwise debt Navi->Karthi must be preserved');
        
        console.log('✅ EXPENSE 2 & NO GLOBAL ROUTING PASS');

        // 6. RECORD SETTLEMENT & ROOM TRANSFER
        // Navi gives Karthi 100
        // Find Navi member id and Karthi member id inside the room
        const roomMemberNavi = members.find(m => m.full_name === 'Navi').member_id;
        const roomMemberKarthi = members.find(m => m.full_name === 'Karthi').member_id;

        await request(`/rooms/${roomId}/settlements`, 'POST', {
            paidBy: roomMemberNavi,
            paidTo: roomMemberKarthi,
            amount: 100,
            settlementDate: new Date().toISOString().split('T')[0],
            note: 'Settled coffee'
        }, tokens['Navi']);
        console.log('Navi settled 100 to Karthi');

        recommendations = await request(`/rooms/${roomId}/settlements/recommendations`, 'GET', null, tokens['Karthi']);
        naviToKarthi = recommendations.find(r => r.fromName === 'Navi' && r.toName === 'Karthi');
        assert(!naviToKarthi, 'Navi should no longer owe Karthi');
        
        console.log('✅ SETTLEMENT PAYMENT PASS');

        // 7. PERSONAL MONEY
        await request('/personal/transactions', 'POST', {
            type: 'INCOME', category: 'Salary', amount: 15000, transactionDate: new Date().toISOString().split('T')[0]
        }, tokens['Karthi']);
        
        await request('/personal/transactions', 'POST', {
            type: 'EXPENSE', category: 'Shopping', amount: 1000, transactionDate: new Date().toISOString().split('T')[0]
        }, tokens['Karthi']);
        
        let pdashboard = await request('/personal/dashboard', 'GET', null, tokens['Karthi']);
        assert.strictEqual(pdashboard.currentBalance, 14000, 'Personal balance should be 14000');
        
        // Optional Transfer to personal money
        await request('/personal/transactions', 'POST', {
            type: 'INCOME', category: 'Room Settlement', amount: 100, transactionDate: new Date().toISOString().split('T')[0]
        }, tokens['Karthi']);
        
        pdashboard = await request('/personal/dashboard', 'GET', null, tokens['Karthi']);
        assert.strictEqual(pdashboard.currentBalance, 14100, 'Personal balance should be 14100 after transfer');
        
        console.log('✅ PERSONAL MONEY PASS');

        // 8. ROOM ISOLATION
        // Karthi is in Room A. UserB creates Room B.
        const resB = await request('/auth/register', 'POST', {
            username: 'userb' + Date.now(), fullName: 'User B', password: 'password123'
        });
        const tokenB = resB.token;
        const roomBRes = await request('/rooms', 'POST', { roomName: 'Room B' }, tokenB);
        const roomBId = roomBRes.id;
        
        try {
            await request(`/rooms/${roomBId}/expenses`, 'GET', null, tokens['Karthi']);
            throw new Error('Karthi should not be able to access Room B');
        } catch (e) {
            assert(e.message.includes('403'), 'Room isolation must return 403');
        }
        console.log('✅ ROOM ISOLATION PASS');

        console.log('ALL TESTS PASSED SUCCESSFULLY! 🎉');

    } catch (err) {
        console.error('TEST FAILED:', err.message);
        process.exit(1);
    }
}

runTests();
