import { KivoProtected } from '@/components/KivoProtected';
import { KivoNotificationsSheet } from '@/components/KivoNotificationsSheet';

export default function NotificationsPage() {
  return (
    <KivoProtected>
      <KivoNotificationsSheet />
    </KivoProtected>
  );
}
