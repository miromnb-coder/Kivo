import { KivoComposer } from './KivoComposer';
import { KivoTopBar } from './KivoTopBar';

export function KivoStartScreen() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f5]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,#ffffff_0%,#f5f5f6_60%,#f0f0f2_100%)]" />

      <div className="relative z-10 mx-auto min-h-screen w-full max-w-[430px]">
        <KivoTopBar />

        <section className="absolute left-1/2 top-[51%] w-full -translate-x-1/2 -translate-y-1/2 px-[36px] text-center">
          <h1 className="mx-auto max-w-[320px] text-[32px] leading-[1.2] tracking-[-0.04em] text-[#202024]">
            How can I help you today?
          </h1>
          <p className="mt-[18px] text-[17px] tracking-[-0.02em] text-[#b2b2b7]">
            Your personal AI assistant
          </p>
        </section>

        <KivoComposer />
      </div>
    </main>
  );
}
