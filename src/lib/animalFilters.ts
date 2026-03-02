import { Animal, UserType, MonthlyAggregate } from '@/types';

/**
 * Minimal transaction shape needed for chart data generation.
 * Both AnimalTransactionType and LeanTransaction satisfy this interface,
 * allowing chart functions to work with either full or lean transactions.
 */
interface ChartTransaction {
  id: string;
  date: number;
  modifiedBy: string;
  status?: string;
}

/**
 * Filters animals that were active (not adopted) in a specific month
 *
 * An animal is considered active in a month if:
 * 1. It was created before or during that month (waitingSince <= end of month)
 * 2. It wasn't adopted before that month, OR it was adopted during/after that month
 *
 * Uses animal.id === transaction.id for reliable data relationships.
 *
 * @param params - Parameters object
 * @param params.animals - Array of all animals in the system
 * @param params.transactions - Array of all animal transactions
 * @param params.year - Target year (e.g., 2024)
 * @param params.month - Target month (0-11, JavaScript months)
 * @returns Array of animals that were active in the specified month
 *
 * @example
 * const activeAnimals = getActiveAnimalsByMonth({
 *   animals,
 *   transactions,
 *   year: 2024,
 *   month: 5 // June (0-indexed)
 * });
 * // Returns: [Animal[], Animal[], ...] - animals seeking homes in June 2024
 */
export function getActiveAnimalsByMonth({
  animals,
  transactions,
  year,
  month,
}: {
  animals: Animal[];
  transactions: ChartTransaction[];
  year: number;
  month: number; // 0-11 (JavaScript months)
}): Animal[] {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return animals.filter((animal) => {
    // 1. Animal must have been created before the end of the month
    const animalCreated = new Date(animal.waitingSince);
    if (animalCreated > endOfMonth) {
      return false; // Animal didn't exist yet
    }

    // 2. Check if animal was adopted before this month
    // Look for adoption transactions (status = 'adoptado' in transactions)
    const adoptionTransactions = transactions
      .filter(
        (transaction) =>
          transaction.id === animal.id && // Match by ID for data integrity
          animal.status === 'adoptado' && // Current status is adopted
          new Date(transaction.date) <= endOfMonth
      )
      .sort(
        (transactionA, transactionB) => transactionB.date - transactionA.date // Most recent first
      );

    // 3. If no adoption transactions, animal was active
    if (adoptionTransactions.length === 0) {
      return animal.status !== 'adoptado'; // Only count if not currently adopted
    }

    // 4. If adopted before the start of the month, it wasn't active
    const lastAdoption = adoptionTransactions[0];
    return new Date(lastAdoption.date) >= startOfMonth;
  });
}

/**
 * Generates chart data for active animals per month
 *
 * Creates a time series showing how many animals were actively
 * seeking homes in each of the last N months.
 *
 * @param params - Parameters object
 * @param params.animals - Array of all animals in the system
 * @param params.transactions - Array of all animal transactions
 * @param params.months - Number of months to include in the chart (default: 6)
 * @returns Array of chart data points with labels and values
 *
 * @example
 * const chartData = generateActiveAnimalsChartData({ animals, transactions, months: 6 });
 * // Returns: [{ label: "ene", value: 15 }, { label: "feb", value: 18 }, ...]
 */
export function generateActiveAnimalsChartData({
  animals,
  transactions,
  months,
  startDate,
  endDate,
  dayInterval = 30,
}: {
  animals: Animal[];
  transactions: ChartTransaction[];
  months?: number;
  startDate?: number;
  endDate?: number;
  dayInterval?: number;
}): { label: string; value: number }[] {
  const chartData = [];

  // Use new date range logic if provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periods: { periodStart: Date; periodEnd: Date }[] = [];

    // Calculate periods from endDate backwards
    const currentEnd = new Date(end);

    while (currentEnd >= start) {
      const periodStart = new Date(currentEnd);
      periodStart.setDate(periodStart.getDate() - dayInterval + 1);

      // Adjust if we go before startDate
      if (periodStart < start) {
        periodStart.setTime(start.getTime());
      }

      periods.unshift({ periodStart, periodEnd: new Date(currentEnd) });

      // Move to next period (backwards)
      currentEnd.setDate(currentEnd.getDate() - dayInterval);
    }

    // Generate chart data for each period
    periods.forEach(({ periodStart, periodEnd }) => {
      // Count active animals in this period
      const activeCount = animals.filter((animal) => {
        const createdDate = new Date(animal.waitingSince);
        if (createdDate > periodEnd) return false;

        // Check if adopted before this period
        const adoptedTransaction = transactions.find(
          (t) => t.id === animal.id && t.status === 'adoptado'
        );
        if (adoptedTransaction) {
          const adoptedDate = new Date(adoptedTransaction.date);
          if (adoptedDate < periodStart) return false;
        }

        return true;
      }).length;

      const label =
        dayInterval === 1
          ? periodEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
          : dayInterval < 30
            ? `${periodEnd.getDate()}/${periodEnd.getMonth() + 1}`
            : periodEnd.toLocaleDateString('es-ES', { month: 'short' });

      chartData.push({
        label,
        value: activeCount,
      });
    });
  } else {
    // Legacy monthly logic
    const currentDate = new Date();
    const monthsToUse = months || 6;

    for (let monthIndex = monthsToUse - 1; monthIndex >= 0; monthIndex--) {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(targetDate.getMonth() - monthIndex);

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      const activeAnimals = getActiveAnimalsByMonth({ animals, transactions, year, month });

      chartData.push({
        label: targetDate.toLocaleDateString('es-ES', { month: 'short' }),
        value: activeAnimals.length,
      });
    }
  }

  return chartData;
}

/**
 * Generates user transaction analysis data, showing the most active users
 *
 * Counts how many transactions each user has performed and maps
 * email addresses to display names using the authorized users data.
 * Returns top 10 most active users. Can optionally filter to show
 * only recent activity from the last N months.
 *
 * @param params - Parameters object
 * @param params.transactions - Array of all animal transactions
 * @param params.users - Array of authorized users with email-to-name mapping
 * @param params.months - Optional: Number of months to include (default: all time)
 * @returns Array of pie chart data with user names and transaction counts
 *
 * @example
 * // All time data
 * const userData = generateTransactionsByUserData({ transactions, users });
 * // Returns: [{ name: "Juan Pérez", value: 25 }, { name: "María López", value: 18 }, ...]
 *
 * @example
 * // Last 6 months only
 * const recentData = generateTransactionsByUserData({ transactions, users, months: 6 });
 * // Returns: [{ name: "Ana García", value: 12 }, { name: "Carlos Ruiz", value: 8 }, ...]
 */
export function generateTransactionsByUserData({
  transactions,
  users,
  months,
}: {
  transactions: ChartTransaction[];
  users: UserType[];
  months?: number;
}): { name: string; value: number }[] {
  // Filter transactions by date if months parameter is provided
  let filteredTransactions = transactions;
  if (months) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    filteredTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= cutoffDate;
    });
  }

  // Create email to name mapping
  const emailToName: Record<string, string> = {};
  users.forEach((user) => {
    emailToName[user.id] = user.name; // user.id is the email
  });

  // Count transactions by user email
  const transactionsByUser: Record<string, number> = {};

  filteredTransactions.forEach((transaction) => {
    const userEmail = transaction.modifiedBy;
    if (userEmail) {
      const userName = emailToName[userEmail] || userEmail.split('@')[0]; // Fallback to email prefix
      transactionsByUser[userName] = (transactionsByUser[userName] || 0) + 1;
    }
  });

  // Convert to arrays and sort by transaction count
  const userEntries = Object.entries(transactionsByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Top 10 users

  return userEntries.map(([userName, count]) => ({
    name: userName,
    value: count,
  }));
}

/**
 * Generates comparison data for new animals vs adoptions per month
 *
 * Creates a multi-line chart showing the flow of animals:
 * - Ingresos: Unique animals that arrived each month (based on waitingSince date)
 * - Adopciones: Unique animals that were adopted each month (based on status change in transactions)
 *
 * Important: Counts unique animals per month, not transaction volume.
 * An animal is only counted once even if it has multiple transactions in the same month.
 *
 * @param params - Parameters object
 * @param params.animals - Array of all animals in the system
 * @param params.transactions - Array of all animal transactions
 * @param params.months - Number of months to include in the chart (default: 6)
 * @returns Array of multi-line chart data with datasets for ingresos and adopciones
 *
 * @example
 * const flowData = generateAnimalsInOutData({ animals, transactions, months: 6 });
 * // Returns: [{
 * //   label: "ene",
 * //   datasets: [
 * //     { name: "Ingresos", value: 8 },    // 8 unique animals arrived
 * //     { name: "Adopciones", value: 5 }   // 5 unique animals adopted
 * //   ]
 * // }, ...]
 */
export function generateAnimalsInOutData({
  animals,
  transactions,
  months,
  startDate,
  endDate,
  dayInterval = 30,
}: {
  animals: Animal[];
  transactions: ChartTransaction[];
  months?: number;
  startDate?: number;
  endDate?: number;
  dayInterval?: number;
}): {
  label: string;
  datasets: { name: string; value: number }[];
}[] {
  const chartData = [];

  // Use new date range logic if provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const periods: { periodStart: Date; periodEnd: Date }[] = [];

    // Calculate periods from endDate backwards
    const currentEnd = new Date(end);
    currentEnd.setHours(23, 59, 59, 999);

    while (currentEnd >= start) {
      const periodStart = new Date(currentEnd);
      periodStart.setDate(periodStart.getDate() - dayInterval + 1);
      periodStart.setHours(0, 0, 0, 0);

      // Adjust if we go before startDate
      if (periodStart < start) {
        periodStart.setTime(start.getTime());
      }

      periods.unshift({ periodStart, periodEnd: new Date(currentEnd) });

      // Move to next period (backwards)
      currentEnd.setDate(currentEnd.getDate() - dayInterval);
      currentEnd.setHours(23, 59, 59, 999);
    }

    // Generate chart data for each period
    periods.forEach(({ periodStart, periodEnd }) => {
      // Animals that arrived in this period
      const newAnimals = animals.filter((animal) => {
        const animalCreated = new Date(animal.waitingSince);
        return animalCreated >= periodStart && animalCreated <= periodEnd;
      });

      // Adoptions in this period - Count unique animals that were adopted
      const adoptedAnimalIds = new Set<string>();
      transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date);
        if (
          transactionDate >= periodStart &&
          transactionDate <= periodEnd &&
          transaction.status === 'adoptado'
        ) {
          adoptedAnimalIds.add(transaction.id);
        }
      });

      const label =
        dayInterval === 1
          ? periodEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
          : dayInterval < 30
            ? `${periodEnd.getDate()}/${periodEnd.getMonth() + 1}`
            : periodEnd.toLocaleDateString('es-ES', { month: 'short' });

      chartData.push({
        label,
        datasets: [
          { name: 'Ingresos', value: newAnimals.length },
          { name: 'Adopciones', value: adoptedAnimalIds.size },
        ],
      });
    });
  } else {
    // Legacy monthly logic
    const currentDate = new Date();
    const monthsToUse = months || 6;

    for (let monthIndex = monthsToUse - 1; monthIndex >= 0; monthIndex--) {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(targetDate.getMonth() - monthIndex);

      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      // Animals that arrived this month (unique animals by ID)
      const newAnimals = animals.filter((animal) => {
        const animalCreated = new Date(animal.waitingSince);
        return animalCreated >= startOfMonth && animalCreated <= endOfMonth;
      });

      // Adoptions this month - Count unique animals that were adopted
      // Find transactions in this month that changed status to 'adoptado'
      const adoptedAnimalIds = new Set<string>();
      transactions.forEach((transaction) => {
        const transactionDate = new Date(transaction.date);
        // Check if this transaction happened this month and has status = 'adoptado'
        if (
          transactionDate >= startOfMonth &&
          transactionDate <= endOfMonth &&
          transaction.status === 'adoptado'
        ) {
          adoptedAnimalIds.add(transaction.id);
        }
      });

      chartData.push({
        label: targetDate.toLocaleDateString('es-ES', { month: 'short' }),
        datasets: [
          { name: 'Ingresos', value: newAnimals.length },
          { name: 'Adopciones', value: adoptedAnimalIds.size }, // Count unique animals
        ],
      });
    }
  }

  return chartData;
}

/**
 * Generates animal status distribution for pie chart
 *
 * Counts animals by their current status and returns data suitable
 * for a pie chart. Only includes statuses that have at least one animal.
 *
 * @param params - Parameters object
 * @param params.animals - Array of all animals in the system
 * @returns Array of pie chart data with status names and counts
 *
 * @example
 * const statusData = generateAnimalStatusData({ animals });
 * // Returns: [
 * //   { name: "Adoptado", value: 45 },
 * //   { name: "Protectora", value: 12 },
 * //   { name: "Transitorio", value: 8 }
 * // ]
 */
export function generateAnimalStatusData({
  animals,
}: {
  animals: Animal[];
}): { name: string; value: number }[] {
  const statusCounts = {
    adopted: 0,
    available: 0,
    street: 0,
    temporary: 0,
    shelter: 0,
  };

  animals.forEach((animal) => {
    switch (animal.status) {
      case 'adoptado':
        statusCounts.adopted++;
        break;
      case 'calle':
        statusCounts.street++;
        break;
      case 'transitorio':
        statusCounts.temporary++;
        break;
      case 'protectora':
        statusCounts.shelter++;
        break;
      default:
        statusCounts.available++;
    }
  });

  return [
    { name: 'Adoptado', value: statusCounts.adopted },
    { name: 'Disponible', value: statusCounts.available },
    { name: 'Calle', value: statusCounts.street },
    { name: 'Transitorio', value: statusCounts.temporary },
    { name: 'Protectora', value: statusCounts.shelter },
  ].filter((statusItem) => statusItem.value > 0); // Only show categories with data
}

// ─────────────────────────────────────────────────────────
// Functions for monthly aggregate data (dashboard presets)
// ─────────────────────────────────────────────────────────

/**
 * Returns an array of YYYY-MM keys for the last N months, starting from the current month.
 *
 * @param months - Number of months to generate (including current)
 * @returns Array of month keys like ["2026-01", "2026-02", "2026-03"]
 */
function getMonthKeys(months: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    keys.push(`${year}-${month}`);
  }
  return keys;
}

/**
 * Returns a short month label for a YYYY-MM key.
 *
 * @param monthKey - Key like "2026-03"
 * @returns Short label like "mar"
 */
function monthKeyToLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const d = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return d.toLocaleDateString('es-ES', { month: 'short' });
}

/**
 * Generates "transactions by user" chart data from monthly aggregates.
 * Merges byUser counts from each selected month and returns top 10 users.
 *
 * @param params.monthly - Record of monthly aggregates from dashboard analytics
 * @param params.users - Array of all users (for email→name mapping)
 * @param params.months - Number of months to include
 * @returns Array of { name, value } pairs sorted by transaction count (top 10)
 *
 * @example
 * const userData = generateTransactionsByUserFromAggregates({
 *   monthly: analytics.monthly,
 *   users: initialUsers,
 *   months: 6,
 * });
 */
export function generateTransactionsByUserFromAggregates({
  monthly,
  users,
  months,
}: {
  monthly: Record<string, MonthlyAggregate>;
  users: UserType[];
  months: number;
}): { name: string; value: number }[] {
  const keys = getMonthKeys(months);

  // Merge byUser counts
  const merged: Record<string, number> = {};
  keys.forEach((key) => {
    const agg = monthly[key];
    if (!agg) return;
    Object.entries(agg.byUser).forEach(([email, count]) => {
      merged[email] = (merged[email] || 0) + count;
    });
  });

  // Email to name mapping
  const emailToName: Record<string, string> = {};
  users.forEach((user) => {
    emailToName[user.id] = user.name;
  });

  return Object.entries(merged)
    .map(([email, count]) => ({
      name: emailToName[email] || email.split('@')[0],
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

/**
 * Generates "Ingresos vs Adopciones" multi-line chart from monthly aggregates.
 * For each month: Ingresos = animals created in that month (from animals array),
 * Adopciones = adoptionCount from the aggregate.
 *
 * @param params.animals - Array of all animals (for waitingSince dates)
 * @param params.monthly - Record of monthly aggregates
 * @param params.months - Number of months to include
 * @returns Array of multi-line chart data points
 *
 * @example
 * const flowData = generateAnimalsInOutFromAggregates({
 *   animals: initialAnimals,
 *   monthly: analytics.monthly,
 *   months: 6,
 * });
 */
export function generateAnimalsInOutFromAggregates({
  animals,
  monthly,
  months,
}: {
  animals: Animal[];
  monthly: Record<string, MonthlyAggregate>;
  months: number;
}): {
  label: string;
  datasets: { name: string; value: number }[];
}[] {
  const keys = getMonthKeys(months);

  return keys.map((key) => {
    const [yearStr, monthStr] = key.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Animals that arrived this month
    const newAnimals = animals.filter((animal) => {
      const created = new Date(animal.waitingSince);
      return created >= startOfMonth && created <= endOfMonth;
    });

    const agg = monthly[key];

    return {
      label: monthKeyToLabel(key),
      datasets: [
        { name: 'Ingresos', value: newAnimals.length },
        { name: 'Adopciones', value: agg?.adoptionCount ?? 0 },
      ],
    };
  });
}

/**
 * Generates "Active Animals" line chart from monthly aggregates.
 * For each month: active = (animals created before end of month) - (adopted before end of month).
 * Uses adoptedAnimalIds accumulated from aggregates to track adoptions.
 *
 * @param params.animals - Array of all animals (for waitingSince dates)
 * @param params.monthly - Record of monthly aggregates
 * @param params.months - Number of months to include
 * @returns Array of { label, value } pairs for the line chart
 *
 * @example
 * const activeData = generateActiveAnimalsFromAggregates({
 *   animals: initialAnimals,
 *   monthly: analytics.monthly,
 *   months: 6,
 * });
 */
export function generateActiveAnimalsFromAggregates({
  animals,
  monthly,
  months,
}: {
  animals: Animal[];
  monthly: Record<string, MonthlyAggregate>;
  months: number;
}): { label: string; value: number }[] {
  const keys = getMonthKeys(months);

  // Accumulate adopted animal IDs up to each month
  const allMonthKeys = Object.keys(monthly).sort();
  const adoptedByMonth = new Map<string, Set<string>>();
  const runningAdopted = new Set<string>();

  allMonthKeys.forEach((key) => {
    const agg = monthly[key];
    if (agg) {
      agg.adoptedAnimalIds.forEach((id) => runningAdopted.add(id));
    }
    adoptedByMonth.set(key, new Set(runningAdopted));
  });

  return keys.map((key) => {
    const [yearStr, monthStr] = key.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Animals created before end of this month
    const created = animals.filter((a) => new Date(a.waitingSince) <= endOfMonth);

    // Adopted before or during this month
    const adopted = adoptedByMonth.get(key) ?? new Set<string>();

    const active = created.filter((a) => !adopted.has(a.id));
    return { label: monthKeyToLabel(key), value: active.length };
  });
}
