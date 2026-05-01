'use client';

import { ChevronLeft } from 'lucide-react';

type KivoRepositoriesSheetProps = {
  open: boolean;
  onBack: () => void;
  repositories: string[];
  enabledRepositories: Record<string, boolean>;
  onToggleRepository: (repository: string) => void;
};

export function KivoRepositoriesSheet({
  open,
  onBack,
  repositories,
  enabledRepositories,
  onToggleRepository,
}: KivoRepositoriesSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[125] bg-black/35 backdrop-blur-[3px]">
      <section className="absolute inset-x-0 bottom-0 mx-auto h-[92vh] max-w-[430px] overflow-hidden rounded-t-[28px] bg-[#fbfbfc] shadow-[0_-18px_46px_rgba(0,0,0,0.16)]">
        <div className="absolute left-0 right-0 top-0 z-10 bg-[#fbfbfc]/92 px-[18px] pt-[14px] backdrop-blur-xl">
          <div className="mx-auto h-[5px] w-[40px] rounded-full bg-[#c5c5ca]" />
          <div className="relative mt-[18px] flex h-[40px] items-center justify-center">
            <button type="button" onClick={onBack} aria-label="Back to connectors" className="absolute left-0 flex h-[40px] items-center gap-[4px] text-[#1787d8]">
              <ChevronLeft size={28} strokeWidth={2.1} />
              <span className="text-[17px] tracking-[-0.025em]">Connectors</span>
            </button>
            <h2 className="text-[20px] font-semibold tracking-[-0.035em] text-[#111]">Repositories</h2>
          </div>
        </div>

        <div className="h-full overflow-y-auto px-[18px] pb-[calc(env(safe-area-inset-bottom)+22px)] pt-[108px]">
          <div className="overflow-hidden rounded-[24px] bg-[#f4f4f5] px-[18px]">
            {repositories.map((repository, index) => {
              const enabled = Boolean(enabledRepositories[repository]);

              return (
                <div key={repository}>
                  <button
                    type="button"
                    onClick={() => onToggleRepository(repository)}
                    className="flex h-[58px] w-full items-center gap-[18px] text-left text-[#2c2d31]"
                  >
                    <span className="flex h-[28px] w-[28px] items-center justify-center text-[#4a4b50]">
                      <span className="h-[22px] w-[18px] rounded-[3px] border-[2px] border-current" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[21px] tracking-[-0.035em]">{repository}</span>
                    <span className={`relative h-[34px] w-[56px] rounded-full transition-colors ${enabled ? 'bg-[#0a84ff]' : 'bg-[#e2e2e4]'}`}>
                      <span className={`absolute top-[3px] h-[28px] w-[28px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.18)] transition-transform ${enabled ? 'translate-x-[25px]' : 'translate-x-[3px]'}`} />
                    </span>
                  </button>
                  {index < repositories.length - 1 ? <div className="ml-[46px] h-px bg-[#dddddf]" /> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
