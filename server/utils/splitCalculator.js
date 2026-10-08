/**
 * Split calculation engine for SplitEase
 * Supports Equal, Exact, Percentage, and Shares splits with precision balancing.
 */

export const calculateSplit = ({ amount, splitType, participants }) => {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Expense amount must be a positive number');
  }

  if (!Array.isArray(participants) || participants.length === 0) {
    throw new Error('At least one participant is required');
  }

  const count = participants.length;
  let calculatedParticipants = [];

  switch (splitType) {
    case 'equal': {
      // Divide evenly, distribute pennies/paise to avoid rounding drift
      const baseShare = Math.floor((numericAmount / count) * 100) / 100;
      let remainderCents = Math.round((numericAmount - baseShare * count) * 100);

      calculatedParticipants = participants.map((p, idx) => {
        let share = baseShare;
        if (idx < remainderCents) {
          share = Math.round((share + 0.01) * 100) / 100;
        }
        return {
          user: p.user,
          shareAmount: share,
          inputValue: 1,
        };
      });
      break;
    }

    case 'exact': {
      let sum = 0;
      calculatedParticipants = participants.map((p) => {
        const val = parseFloat(p.inputValue || p.shareAmount || 0);
        if (isNaN(val) || val < 0) {
          throw new Error('Exact share amounts must be non-negative numbers');
        }
        const rounded = Math.round(val * 100) / 100;
        sum += rounded;
        return {
          user: p.user,
          shareAmount: rounded,
          inputValue: rounded,
        };
      });

      sum = Math.round(sum * 100) / 100;
      if (Math.abs(sum - numericAmount) > 0.01) {
        throw new Error(
          `The split amounts (total: ₹${sum.toFixed(2)}) must equal ₹${numericAmount.toFixed(2)}.`
        );
      }
      break;
    }

    case 'percentage': {
      let totalPercent = 0;
      participants.forEach((p) => {
        const pct = parseFloat(p.inputValue || 0);
        if (isNaN(pct) || pct < 0) {
          throw new Error('Percentages must be non-negative numbers');
        }
        totalPercent += pct;
      });

      totalPercent = Math.round(totalPercent * 100) / 100;
      if (Math.abs(totalPercent - 100) > 0.01) {
        throw new Error(
          `The total percentage must equal 100%. Currently it is ${totalPercent}%.`
        );
      }

      let distributedSum = 0;
      calculatedParticipants = participants.map((p) => {
        const pct = parseFloat(p.inputValue || 0);
        const share = Math.floor(((numericAmount * pct) / 100) * 100) / 100;
        distributedSum += share;
        return {
          user: p.user,
          shareAmount: share,
          inputValue: pct,
        };
      });

      // Adjust rounding cent on highest share
      let diff = Math.round((numericAmount - distributedSum) * 100) / 100;
      if (diff !== 0 && calculatedParticipants.length > 0) {
        calculatedParticipants[0].shareAmount =
          Math.round((calculatedParticipants[0].shareAmount + diff) * 100) / 100;
      }
      break;
    }

    case 'shares': {
      let totalShares = 0;
      participants.forEach((p) => {
        const shares = parseFloat(p.inputValue || 1);
        if (isNaN(shares) || shares <= 0) {
          throw new Error('Shares must be greater than zero');
        }
        totalShares += shares;
      });

      if (totalShares <= 0) {
        throw new Error('Total shares must be greater than zero');
      }

      let distributedSum = 0;
      calculatedParticipants = participants.map((p) => {
        const shares = parseFloat(p.inputValue || 1);
        const share = Math.floor(((numericAmount * shares) / totalShares) * 100) / 100;
        distributedSum += share;
        return {
          user: p.user,
          shareAmount: share,
          inputValue: shares,
        };
      });

      let diff = Math.round((numericAmount - distributedSum) * 100) / 100;
      if (diff !== 0 && calculatedParticipants.length > 0) {
        calculatedParticipants[0].shareAmount =
          Math.round((calculatedParticipants[0].shareAmount + diff) * 100) / 100;
      }
      break;
    }

    default:
      throw new Error(`Unsupported split type: ${splitType}`);
  }

  return calculatedParticipants;
};
