const db = require('../config/db');

exports.calculateBalances = async (roomId, startDate, endDate) => {
    // 1. Get all active members for this room
    const [members] = await db.query('SELECT m.name, m.id FROM members m WHERE m.room_id = ? AND m.is_active = TRUE', [roomId]);
    
    // Initialize balances object
    const balances = {};
    members.forEach(m => {
        balances[m.id] = {
            memberId: m.id,
            name: m.name,
            totalPaid: 0,
            totalShare: 0,
            totalReceived: 0,
            totalGiven: 0,
            balance: 0
        };
    });

    let dateCondition = '';
    const dateParams = [];
    if (startDate && endDate) {
        dateCondition = ' AND e.expense_date BETWEEN ? AND ?';
        dateParams.push(startDate, endDate);
    }

    // 2. Calculate Total Paid (from expense_items)
    const [paidResults] = await db.query(`
        SELECT ei.paid_by, SUM(ei.amount) as amount 
        FROM expense_items ei
        JOIN expenses e ON ei.expense_id = e.id
        WHERE e.room_id = ? ${dateCondition} 
        GROUP BY ei.paid_by
    `, [roomId, ...dateParams]);
    
    paidResults.forEach(r => {
        if (balances[r.paid_by]) {
            balances[r.paid_by].totalPaid = Number(r.amount);
        }
    });

    // 3. Calculate Total Share (from expense_item_participants)
    const [shareResults] = await db.query(`
        SELECT eip.member_id, SUM(eip.share_amount) as amount
        FROM expense_item_participants eip
        JOIN expense_items ei ON eip.expense_item_id = ei.id
        JOIN expenses e ON ei.expense_id = e.id
        WHERE e.room_id = ? ${dateCondition}
        GROUP BY eip.member_id
    `, [roomId, ...dateParams]);

    shareResults.forEach(r => {
        if (balances[r.member_id]) {
            balances[r.member_id].totalShare = Number(r.amount);
        }
    });

    // 4. Calculate Settlements
    let settlementCondition = '';
    const settlementParams = [];
    if (startDate && endDate) {
        settlementCondition = ' AND settlement_date BETWEEN ? AND ?';
        settlementParams.push(startDate, endDate);
    }

    // Given (From)
    const [givenResults] = await db.query(`
        SELECT from_member, SUM(amount) as amount
        FROM settlements
        WHERE room_id = ? ${settlementCondition}
        GROUP BY from_member
    `, [roomId, ...settlementParams]);

    givenResults.forEach(r => {
        if (balances[r.from_member]) {
            balances[r.from_member].totalGiven = Number(r.amount);
        }
    });

    // Received (To)
    const [receivedResults] = await db.query(`
        SELECT to_member, SUM(amount) as amount
        FROM settlements
        WHERE room_id = ? ${settlementCondition}
        GROUP BY to_member
    `, [roomId, ...settlementParams]);

    receivedResults.forEach(r => {
        if (balances[r.to_member]) {
            balances[r.to_member].totalReceived = Number(r.amount);
        }
    });

    // 5. Calculate Final Balance
    Object.values(balances).forEach(b => {
        // Correct formula: totalPaid (from expenses) - totalShare (from expenses) 
        // + totalGiven (settlements sent) - totalReceived (settlements received)
        b.balance = Number((b.totalPaid - b.totalShare + b.totalGiven - b.totalReceived).toFixed(2));
    });

    return Object.values(balances);
};

exports.calculateExactDebts = async (roomId, startDate, endDate) => {
    let dateCondition = '';
    const dateParams = [];
    if (startDate && endDate) {
        dateCondition = ' AND e.expense_date BETWEEN ? AND ?';
        dateParams.push(startDate, endDate);
    }

    // 0. Fetch participants per item to populate the breakdown
    const [participantsRes] = await db.query(`
        SELECT eip.expense_item_id, m.name
        FROM expense_item_participants eip
        JOIN members m ON eip.member_id = m.id
        WHERE m.room_id = ?
    `, [roomId]);
    
    const itemParticipantsMap = {};
    participantsRes.forEach(row => {
        if (!itemParticipantsMap[row.expense_item_id]) {
            itemParticipantsMap[row.expense_item_id] = [];
        }
        itemParticipantsMap[row.expense_item_id].push(row.name);
    });

    // 1. Get raw debts from items (where participant != payer)
    const [itemDebts] = await db.query(`
        SELECT 
            eip.member_id as debtor,
            ei.paid_by as creditor,
            eip.share_amount as amount,
            e.title as expense_title,
            ei.item_name as item_name,
            ei.amount as total_item_amount,
            ei.id as expense_item_id
        FROM expense_item_participants eip
        JOIN expense_items ei ON eip.expense_item_id = ei.id
        JOIN expenses e ON ei.expense_id = e.id
        WHERE e.room_id = ? AND eip.member_id != ei.paid_by ${dateCondition}
    `, [roomId, ...dateParams]);

    // 2. Get completed settlements
    let settlementCondition = '';
    const settlementParams = [];
    if (startDate && endDate) {
        settlementCondition = ' AND settlement_date BETWEEN ? AND ?';
        settlementParams.push(startDate, endDate);
    }
    const [settlements] = await db.query(`
        SELECT 
            from_member as payer,
            to_member as payee,
            amount
        FROM settlements
        WHERE room_id = ? ${settlementCondition}
    `, [roomId, ...settlementParams]);

    // 3. Aggregate net debts and breakdowns
    const pairMap = {};

    const getPairKey = (id1, id2) => {
        return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
    };

    itemDebts.forEach(d => {
        const debtor = d.debtor;
        const creditor = d.creditor;
        const key = getPairKey(debtor, creditor);
        
        if (!pairMap[key]) {
            pairMap[key] = { A: Math.min(debtor, creditor), B: Math.max(debtor, creditor), netA_to_B: 0, breakdown: [] };
        }
        
        const amount = Number(d.amount);
        const breakdownItem = { 
            type: 'EXPENSE', 
            from: debtor, 
            to: creditor, 
            amount: amount, 
            title: `${d.expense_title} - ${d.item_name}`,
            totalItemAmount: Number(d.total_item_amount),
            participants: itemParticipantsMap[d.expense_item_id] || []
        };

        if (debtor === pairMap[key].A) {
            pairMap[key].netA_to_B += amount;
            pairMap[key].breakdown.push(breakdownItem);
        } else {
            pairMap[key].netA_to_B -= amount;
            pairMap[key].breakdown.push(breakdownItem);
        }
    });

    settlements.forEach(s => {
        const payer = s.payer;
        const payee = s.payee;
        const key = getPairKey(payer, payee);
        
        if (!pairMap[key]) {
            pairMap[key] = { A: Math.min(payer, payee), B: Math.max(payer, payee), netA_to_B: 0, breakdown: [] };
        }
        
        const amount = Number(s.amount);
        // Settlement reduces the debt from payer to payee.
        if (payer === pairMap[key].A) {
            pairMap[key].netA_to_B -= amount;
            pairMap[key].breakdown.push({ type: 'SETTLEMENT', from: payer, to: payee, amount: amount, title: `Payment` });
        } else {
            pairMap[key].netA_to_B += amount;
            pairMap[key].breakdown.push({ type: 'SETTLEMENT', from: payer, to: payee, amount: amount, title: `Payment` });
        }
    });

    const finalDebts = [];
    Object.values(pairMap).forEach(pair => {
        let net = pair.netA_to_B;
        if (Math.abs(net) > 0.001) {
            if (net > 0) {
                // A owes B
                finalDebts.push({
                    from: pair.A,
                    to: pair.B,
                    amount: Math.round(net * 100) / 100,
                    breakdown: pair.breakdown
                });
            } else {
                // B owes A
                finalDebts.push({
                    from: pair.B,
                    to: pair.A,
                    amount: Math.round(Math.abs(net) * 100) / 100,
                    breakdown: pair.breakdown
                });
            }
        }
    });

    return finalDebts;
};
