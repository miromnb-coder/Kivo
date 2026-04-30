import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';

export function KivoStartScreen() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,#f9f9fa_0%,#f3f3f5_64%,#efeff1_100%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[430px] flex-col">
        <KivoTopBar />

        <section className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 px-12 text-center">
          <h1 className="max-w-[320px] text-[36px] leading-[1.2] tracking-[-0.03em] text-[#232326]">
            {"How can I " + "help you today?"}
          </h1>
          <p className="mt-8 text-[18px] tracking-[-0.015em] text-[#9a9aa0]">
            Your personal AI assistant
          </p>
        </section>

        <KivoComposer />
      </div>
    </main>
  );
}
