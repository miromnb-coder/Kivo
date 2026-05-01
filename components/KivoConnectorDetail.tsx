'use client';

import { ArrowUpRight, ChevronLeft, Lock } from 'lucide-react';

type DetailRow = {
  label: string;
  value?: string;
  arrow?: boolean;
};

type ConnectorDetailProps = {
  open: boolean;
  onBack: () => void;
  onClose: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  connectorType: string;
  author: string;
  buttonLabel: string;
  rows?: DetailRow[];
};

function DetailRowItem({ label, value, arrow }: DetailRow) {
  return (
    <div className="flex h-[50px] items-center border-b border-[#e7e7e9] last:border-b-0">
      <div className="flex-1 text-[15.5px] tracking-[-0.025em] text-[#5e5f64]">{label}</div>
      {value ? <div className="text-[15.5px] tracking-[-0.025em] text-[#222327]">{value}</div> : null}
      {arrow ? <ArrowUpRight size={21} strokeWidth={2} className="text-[#74757a]" /> : null}
    </div>
  );
}

export function KivoConnectorDetail({
  open,
  onBack,
  onClose,
  icon,
  title,
  description,
  connectorType,
  author,
  buttonLabel,
  rows,
}: ConnectorDetailProps) {
  if (!open) return null;

  const detailRows = rows ?? [
    { label: 'Connector Type', value: connectorType },
    { label: 'Author', value: author },
    { label: 'Website', arrow: true },
    { label: 'Privacy Policy', arrow: true },
    { label: 'Provide feedback', arrow: true },
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[3px]">
      <button type="button" aria-label="Close connector detail" onClick={onClose} className="absolute inset-0" />

      <section className="absolute inset-x-0 bottom-0 mx-auto h-[92vh] max-w-[430px] overflow-hidden rounded-t-[28px] bg-[#fbfbfc] shadow-[0_-18px_46px_rgba(0,0,0,0.16)]">
        <div className="absolute left-0 right-0 top-0 z-10 bg-[#fbfbfc]/92 px-[18px] pt-[14px] backdrop-blur-xl">
          <div className="mx-auto h-[5px] w-[40px] rounded-full bg-[#c5c5ca]" />
          <button type="button" onClick={onBack} aria-label="Back" className="mt-[18px] flex h-[40px] w-[40px] items-center justify-center text-[#191a1d]">
            <ChevronLeft size={26} strokeWidth={2.1} />
          </button>
        </div>

        <div className="flex h-full flex-col px-[26px] pb-[calc(env(safe-area-inset-bottom)+22px)] pt-[88px]">
          <div className="flex-1 overflow-y-auto pb-[24px]">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[18px] border border-[#ececef] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.035)]">
                {icon}
              </div>
              <h1 className="mt-[20px] text-[26px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#111214]">{title}</h1>
              <p className="mt-[14px] max-w-[360px] text-[17px] leading-[1.42] tracking-[-0.035em] text-[#4f5055]">{description}</p>
            </div>

            <h2 className="mt-[46px] text-[18px] font-semibold tracking-[-0.035em] text-[#111214]">Details</h2>
            <div className="mt-[12px] rounded-[22px] border border-[#ececef] bg-white/46 px-[18px] shadow-[0_8px_26px_rgba(15,23,42,0.018)] backdrop-blur-[14px]">
              {detailRows.map((row) => (
                <DetailRowItem key={row.label} {...row} />
              ))}
            </div>
          </div>

          <button
            type="button"
            className="flex h-[62px] w-full items-center justify-center rounded-[18px] bg-[#111113] text-[17px] font-semibold tracking-[-0.025em] text-white shadow-[0_16px_32px_rgba(0,0,0,0.14)]"
          >
            {buttonLabel}
          </button>

          <div className="mt-[16px] flex items-center justify-center gap-[8px] text-[13.5px] tracking-[-0.02em] text-[#929399]">
            <Lock size={14} strokeWidth={2} />
            <span>Your data is private and secure. You can disconnect anytime.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
