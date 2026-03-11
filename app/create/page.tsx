import { TopTabs } from '../../components/top-tabs';
import { CreateFiatWagerForm } from '../../components/create-fiat-wager-form';

export default function CreatePage() {
  return (
    <main className="shell grid" style={{ gap: 24 }}>
      <TopTabs />
      <CreateFiatWagerForm />
    </main>
  );
}
