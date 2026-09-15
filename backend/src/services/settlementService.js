const pool = require('../config/db');

const calculateBalances = async (roomId) => {
    // 1. Get all active members
    const [members] = await pool.query(
        'SELECT m.id, u.full_name FROM members m JOIN users u ON m.user_id = u.id WHERE m.room_id = ? AND m.is_active = TRUE',
        [roomId]
    );

    const balances = {};
    members.forEach(m => {
        balances[m.id] = {
            memberId: m.id,
            name: m.full_name,
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
        // netBalance = totalPaid - totalShare
        // Positive means they are owed money (Creditor)
        // Negative means they owe money (Debtor)
        b.netBalance = parseFloat((b.totalPaid - b.totalShare).toFixed(2));
    });

    return Object.values(balances);
};

const getSettlementRecommendations = async (roomId) => {
    const balances = await calculateBalances(roomId);

    const debtors = [];
    const creditors = [];

    balances.forEach(b => {
        if (b.netBalance < -0.01) debtors.push({ ...b, amount: Math.abs(b.netBalance) });
        else if (b.netBalance > 0.01) creditors.push({ ...b, amount: b.netBalance });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(debtor.amount, creditor.amount);
        const settledAmount = parseFloat(amount.toFixed(2));

        if (settledAmount > 0) {
            transactions.push({
                from: debtor.memberId,
                fromName: debtor.name,
                to: creditor.memberId,
                toName: creditor.name,
                amount: settledAmount
            });
        }

        debtor.amount -= settledAmount;
        creditor.amount -= settledAmount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return transactions;
};

module.exports = {
    calculateBalances,
    getSettlementRecommendations
};
