import { KivoHistoryScreen } from '@/components/KivoHistoryScreen';
import { KivoProtected } from '@/components/KivoProtected';

export default function HistoryPage() {
  return (
    <KivoProtected>
      <KivoHistoryScreen />
    </KivoProtected>
  );
}
