import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';

export function KivoStartScreen() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f2f2f4]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#f9f9fa_0%,#f2f2f4_65%,#eeeeef_100%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col">
        <KivoTopBar />

        <section className="flex flex-1 flex-col items-center justify-center px-10 pb-36 -mt-16 text-center">
          <h1 className="text-[56px] leading-[1.18] tracking-[-0.03em] text-[#202024] scale-[0.45]">How can I help you today?</h1>
          <p className="mt-3 text-[39px] font-normal tracking-[-0.015em] text-[#99999d] scale-[0.45]">Your personal AI assistant</p>
        </section>

        <KivoComposer />
      </div>
    </main>
  );
}
