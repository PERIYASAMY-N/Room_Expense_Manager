const pool = require('../config/db');

// Calculate complete pairwise ledger and net settlements
const calculatePairwiseSettlements = async (roomId) => {
    // 1. Get all expenses in the room
    const [expenses] = await pool.query(
        'SELECT id, title, total_amount, expense_date FROM room_expenses WHERE room_id = ?',
        [roomId]
    );

    // Get members mapping for names
    const [members] = await pool.query(
        'SELECT m.id as member_id, u.full_name FROM members m JOIN users u ON m.user_id = u.id WHERE m.room_id = ?',
        [roomId]
    );
    const memberNameMap = {};
    members.forEach(m => memberNameMap[m.member_id] = m.full_name);

    const [payers] = await pool.query(
        'SELECT p.expense_id, p.member_id, p.amount_paid FROM room_expense_payers p JOIN room_expenses e ON p.expense_id = e.id WHERE e.room_id = ?',
        [roomId]
    );

    const [participants] = await pool.query(
        'SELECT p.expense_id, p.member_id, p.amount_owed FROM room_expense_participants p JOIN room_expenses e ON p.expense_id = e.id WHERE e.room_id = ?',
        [roomId]
    );

    // 2. Build the expense-level debts
    // For each expense, distribute the amount owed by participants to the payers proportionally.
    const expenseDebts = []; // { from, to, amount, reason, expenseId }

    expenses.forEach(expense => {
        const expPayers = payers.filter(p => p.expense_id === expense.id);
        const expParticipants = participants.filter(p => p.expense_id === expense.id);
        
        const totalPaid = expPayers.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
        
        expParticipants.forEach(participant => {
            const amountOwed = parseFloat(participant.amount_owed);
            if (amountOwed <= 0) return;

            // Distribute this participant's debt to each payer proportionally
            expPayers.forEach(payer => {
                if (payer.member_id === participant.member_id) return; // You don't owe yourself
                
                const payerRatio = parseFloat(payer.amount_paid) / totalPaid;
                const debtAmount = amountOwed * payerRatio;
                
                if (debtAmount > 0.001) {
                    expenseDebts.push({
                        from: participant.member_id,
                        to: payer.member_id,
                        amount: debtAmount,
                        expenseId: expense.id,
                        reason: expense.title
                    });
                }
            });
        });
    });

    // 3. Get explicit settlements (payments already made)
    const [settlements] = await pool.query(
        'SELECT id, paid_by, paid_to, amount, note, settlement_date FROM settlements WHERE room_id = ?',
        [roomId]
    );

    const settlementCredits = settlements.map(s => ({
        from: s.paid_by,
        to: s.paid_to,
        amount: parseFloat(s.amount),
        isSettlement: true,
        reason: s.note || 'Settlement Payment',
        date: s.settlement_date
    }));

    // 4. Pairwise Netting
    // map key: "min(A,B)-max(A,B)" -> { A_owes_B: X, B_owes_A: Y }
    const pairwise = {};

    const addDebt = (from, to, amount) => {
        const min = Math.min(from, to);
        const max = Math.max(from, to);
        const key = `${min}-${max}`;
        if (!pairwise[key]) {
            pairwise[key] = { [min]: 0, [max]: 0 }; // keys are who owes whom. Wait, let's track net balance of min relative to max.
        }
        // min is from, to is max: min owes max.
        if (from === min) {
            pairwise[key][from] += amount;
        } else {
            pairwise[key][from] += amount; // from is max, max owes min
        }
    };

    expenseDebts.forEach(d => addDebt(d.from, d.to, d.amount));
    
    // Settlements act as a reverse debt (reducing the debt)
    // If A pays B 100, it's like B owes A 100 in the net calculation.
    settlementCredits.forEach(s => addDebt(s.to, s.from, s.amount));

    const finalRecommendations = [];
    Object.keys(pairwise).forEach(key => {
        const [minStr, maxStr] = key.split('-');
        const minId = parseInt(minStr);
        const maxId = parseInt(maxStr);
        
        const minOwesMax = pairwise[key][minId];
        const maxOwesMin = pairwise[key][maxId];
        
        const net = minOwesMax - maxOwesMin;
        
        // Due to floating point math, we round to 2 decimals
        const roundedNet = Math.round(net * 100) / 100;

        if (roundedNet > 0) {
            // min owes max
            finalRecommendations.push({
                from: minId,
                fromName: memberNameMap[minId] || 'Unknown',
                to: maxId,
                toName: memberNameMap[maxId] || 'Unknown',
                amount: roundedNet
            });
        } else if (roundedNet < 0) {
            // max owes min
            finalRecommendations.push({
                from: maxId,
                fromName: memberNameMap[maxId] || 'Unknown',
                to: minId,
                toName: memberNameMap[minId] || 'Unknown',
                amount: Math.abs(roundedNet)
            });
        }
    });

    return {
        recommendations: finalRecommendations,
        expenseLedger: expenseDebts,
        settlements: settlementCredits
    };
};

const calculateMemberBalances = async (roomId) => {
    // A simpler summary for the members table: Total Paid, Total Share, Net Balance
    const [members] = await pool.query(
        'SELECT m.id, u.full_name, m.is_active FROM members m JOIN users u ON m.user_id = u.id WHERE m.room_id = ?',
        [roomId]
    );

    const balances = {};
    members.forEach(m => {
        balances[m.id] = {
            memberId: m.id,
            name: m.full_name,
            isActive: m.is_active,
            totalPaid: 0,
            totalShare: 0,
            netBalance: 0
        };
    });

    // 2. Add total paid
    const [payers] = await pool.query(`
        SELECT p.member_id, SUM(p.amount_paid) as total_paid
        FROM room_expense_payers p
        JOIN room_expenses e ON p.expense_id = e.id
        WHERE e.room_id = ?
        GROUP BY p.member_id
    `, [roomId]);

    payers.forEach(p => {
        if (balances[p.member_id]) {
            balances[p.member_id].totalPaid = parseFloat(p.total_paid);
        }
    });

    // 3. Subtract total share
    const [participants] = await pool.query(`
        SELECT p.member_id, SUM(p.amount_owed) as total_share
        FROM room_expense_participants p
        JOIN room_expenses e ON p.expense_id = e.id
        WHERE e.room_id = ?
        GROUP BY p.member_id
    `, [roomId]);

    participants.forEach(p => {
        if (balances[p.member_id]) {
            balances[p.member_id].totalShare = parseFloat(p.total_share);
        }
    });

    // 4. Handle existing settlements
    const [settlementsAsPayer] = await pool.query(
        'SELECT paid_by, SUM(amount) as total_settled FROM settlements WHERE room_id = ? GROUP BY paid_by',
        [roomId]
    );
    const [settlementsAsReceiver] = await pool.query(
        'SELECT paid_to, SUM(amount) as total_received FROM settlements WHERE room_id = ? GROUP BY paid_to',
        [roomId]
    );

    settlementsAsPayer.forEach(s => {
        if (balances[s.paid_by]) {
            balances[s.paid_by].totalPaid += parseFloat(s.total_settled);
        }
    });

    settlementsAsReceiver.forEach(s => {
        if (balances[s.paid_to]) {
            balances[s.paid_to].totalShare += parseFloat(s.total_received);
        }
    });

    // 5. Calculate net balance
    Object.values(balances).forEach(b => {
        b.netBalance = parseFloat((b.totalPaid - b.totalShare).toFixed(2));
    });

    return Object.values(balances);
};

module.exports = {
    calculatePairwiseSettlements,
    calculateMemberBalances
};
