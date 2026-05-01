'use client';

import { ChevronLeft } from 'lucide-react';

type KivoRepositoriesSheetProps = {
  open: boolean;
  onBack: () => void;
  repositories: string[];
  enabledRepositories: Record<string, boolean>;
  onToggleRepository: (repository: string) => void;
};

function RepoIcon() {
  return <span className="h-[23px] w-[18px] rounded-[3.5px] border-[2.2px] border-[#4f5055]" />;
}

function RepoToggle({ enabled }: { enabled: boolean }) {
  return (
    <span className={`relative h-[34px] w-[56px] rounded-full transition-colors ${enabled ? 'bg-[#0a84ff]' : 'bg-[#e2e2e4]'}`}>
      <span className={`absolute top-[3px] h-[28px] w-[28px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.18)] transition-transform ${enabled ? 'translate-x-[25px]' : 'translate-x-[3px]'}`} />
    </span>
  );
}

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
        <div className="absolute left-0 right-0 top-0 z-10 bg-[#fbfbfc]/94 px-[18px] pt-[14px] backdrop-blur-xl">
          <div className="mx-auto h-[5px] w-[40px] rounded-full bg-[#c5c5ca]" />
          <div className="relative mt-[18px] flex h-[42px] items-center justify-center">
            <button type="button" onClick={onBack} aria-label="Back to connectors" className="absolute left-[-4px] flex h-[42px] items-center gap-[2px] text-[#1787d8]">
              <ChevronLeft size={31} strokeWidth={2.2} />
              <span className="text-[20px] tracking-[-0.035em]">Connectors</span>
            </button>
            <h2 className="text-[21px] font-semibold tracking-[-0.04em] text-[#111]">Repositories</h2>
          </div>
        </div>

        <div className="h-full overflow-y-auto px-[18px] pb-[calc(env(safe-area-inset-bottom)+22px)] pt-[124px]">
          {repositories.length > 0 ? (
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
                      <span className="flex h-[28px] w-[28px] items-center justify-center">
                        <RepoIcon />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[21px] tracking-[-0.035em]">{repository}</span>
                      <RepoToggle enabled={enabled} />
                    </button>
                    {index < repositories.length - 1 ? <div className="ml-[46px] h-px bg-[#dddddf]" /> : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] bg-[#f4f4f5] px-[22px] py-[28px] text-center">
              <div className="mx-auto flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-white/70 shadow-[0_8px_22px_rgba(15,23,42,0.035)]">
                <RepoIcon />
              </div>
              <h3 className="mt-[16px] text-[20px] font-semibold tracking-[-0.04em] text-[#202124]">No repositories yet</h3>
              <p className="mx-auto mt-[8px] max-w-[290px] text-[15.5px] leading-[1.35] tracking-[-0.025em] text-[#77787d]">
                Repositories will appear here after GitHub is connected and synced.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
