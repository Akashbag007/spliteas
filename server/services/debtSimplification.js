/**
 * Greedy Debt Simplification Algorithm
 * Converts net balances into the minimum practical number of direct settlements.
 *
 * @param {Array} balances - Array of { user: { _id, name, email, avatar }, netBalance: Number }
 * @returns {Array} - Array of simplified debt transactions: { from, to, amount }
 */
export const simplifyDebts = (balances) => {
  const debtors = [];
  const creditors = [];

  balances.forEach((item) => {
    const net = Math.round(item.netBalance * 100) / 100;
    if (net < -0.01) {
      debtors.push({
        user: item.user,
        amount: Math.abs(net),
      });
    } else if (net > 0.01) {
      creditors.push({
        user: item.user,
        amount: net,
      });
    }
  });

  // Sort descending
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(settledAmount * 100) / 100;

    if (roundedAmount > 0) {
      transactions.push({
        from: debtor.user,
        to: creditor.user,
        amount: roundedAmount,
      });
    }

    debtor.amount = Math.round((debtor.amount - roundedAmount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - roundedAmount) * 100) / 100;

    if (debtor.amount < 0.01) {
      i++;
    }
    if (creditor.amount < 0.01) {
      j++;
    }
  }

  return transactions;
};
