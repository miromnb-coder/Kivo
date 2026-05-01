'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Github, Globe2, Plus, SlidersHorizontal, X } from 'lucide-react';
import { KivoCalendarConnectorDetail } from './KivoCalendarConnectorDetail';
import { KivoGmailConnectorDetail } from './KivoGmailConnectorDetail';

// ...rest unchanged until state

export function KivoConnectorsSheet({ open, onClose }: KivoConnectorsSheetProps) {
  const [heightRatio, setHeightRatio] = useState(MEDIUM_HEIGHT);
  const [dragOffset, setDragOffset] = useState(CLOSED_OFFSET);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [calendarDetailOpen, setCalendarDetailOpen] = useState(false);
  const [gmailDetailOpen, setGmailDetailOpen] = useState(false);

// ...rest same

            {connectors.map((connector, index) => (
              <div key={connector.name}>
                <button
                  type="button"
                  onClick={() => {
                    if (connector.name === 'Google Calendar') setCalendarDetailOpen(true);
                    if (connector.name === 'Gmail') setGmailDetailOpen(true);
                  }}
                  className="flex h-[58px] w-full items-center gap-[18px] text-left text-[#2c2d31]"
                >
// ...unchanged

      <KivoCalendarConnectorDetail open={calendarDetailOpen} onBack={() => setCalendarDetailOpen(false)} onClose={closeWithAnimation} />
      <KivoGmailConnectorDetail open={gmailDetailOpen} onBack={() => setGmailDetailOpen(false)} onClose={closeWithAnimation} />
    </div>
  );
}
