import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';

export function KivoStartScreen() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,#f9f9fa_0%,#f3f3f5_64%,#efeff1_100%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[430px] flex-col">
        <KivoTopBar />

        <section className="flex flex-1 flex-col items-center justify-center px-12 pb-52 text-center">
          <h1 className="max-w-[320px] text-[63px] leading-[1.16] tracking-[-0.03em] text-[#232326] scale-[0.38] origin-center">
            How can I help you today?
          </h1>
          <p className="mt-6 text-[39px] font-normal tracking-[-0.015em] text-[#9a9aa0] scale-[0.41] origin-center">
            Your personal AI assistant
          </p>
        </section>

        <KivoComposer />
      </div>
    </main>
  );
}
