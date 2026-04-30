import { KivoStartScreen } from '@/components/KivoStartScreen';
import { KivoProtected } from '@/components/KivoProtected';

export default function ChatPage() {
  return (
    <KivoProtected>
      <KivoStartScreen />
    </KivoProtected>
  );
}
