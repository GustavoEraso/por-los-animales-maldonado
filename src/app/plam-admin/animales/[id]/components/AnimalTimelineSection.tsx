import TransactionCard from '@/components/TransactionCard';
import { AnimalTransactionType } from '@/types';

interface AnimalTimelineSectionProps {
  allAnimalTransactions: AnimalTransactionType[];
}

/**
 * Section displaying the animal's timeline of transactions/events.
 */
export default function AnimalTimelineSection({
  allAnimalTransactions,
}: AnimalTimelineSectionProps): React.ReactElement {
  return (
    <section className="flex flex-col items-center bg-cream-light w-full p-4 gap-1 text-center">
      <h4 className="font-extrabold text-4xl sm:text-7xl text-green-dark">Linea del tiempo</h4>
      <p className="text-green-dark text-md font-bold">
        Este animal ha tenido los siguientes estados a lo largo del tiempo:
      </p>
      <ul className="flex flex-col gap-5 list-disc p-2 text-green-dark max-w-2xl">
        {allAnimalTransactions.map((transaction, index) => (
          <TransactionCard key={`${index}-${transaction.date}`} transaction={transaction} />
        ))}
      </ul>
    </section>
  );
}
