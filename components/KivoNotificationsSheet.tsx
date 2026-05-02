'use client';

import Link from 'next/link';
import { BarChart3, Bell, ChevronLeft, Code2, MessageCircle, Sparkles, Zap } from 'lucide-react';

const notifications = [
  {
    group: 'Today',
    items: [
      { icon: Zap, title: 'Agent completed task', description: 'Data Research agent has finished “Market analysis”', time: '14.32', unread: true },
      { icon: MessageCircle, title: 'New message', description: 'You have a new message from Data Research agent', time: '13.47', unread: true },
      { icon: Sparkles, title: 'Credits updated', description: 'You received 20 new credits', time: '11.15', unread: true },
    ],
  },
  {
    group: 'Yesterday',
    items: [
      { icon: Code2, title: 'Task queued', description: 'Code Assistant agent is working on “Landing page”', time: 'Yesterday', unread: false },
      { icon: Bell, title: 'Reminder', description: 'Don’t forget to review your agents’ performance', time: 'Yesterday', unread: false },
    ],
  },
  {
    group: 'Earlier',
    items: [{ icon: BarChart3, title: 'Weekly summary', description: 'Your weekly summary is ready to view', time: '2d ago', unread: false }],
  },
];

export function KivoNotificationsSheet() {
  return (
    <main className="min-h-[100dvh] bg-[#f6f6f7] text-[#1f2024]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-[radial-gradient(circle_at_50%_12%,#ffffff_0%,#f7f7f8_58%,#f1f1f3_100%)]">
        <header className="relative flex items-center justify-between px-[22px] pt-[calc(env(safe-area-inset-top)+18px)]">
          <Link
            href="/chat"
            aria-label="Back to chat"
            className="flex h-[40px] w-[40px] items-center justify-start rounded-full text-[#202124] transition active:scale-[0.96]"
          >
            <ChevronLeft size={24} strokeWidth={2.1} />
          </Link>

          <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top)+12px)] -translate-x-1/2 text-center">
            <div className="flex items-center justify-center gap-[6px] text-[20px] font-semibold tracking-[-0.035em] text-[#1f2023]">
              <span>Kivo</span>
              <span className="text-[14px] text-[#8e8f95]">⌄</span>
            </div>
            <div className="mt-[2px] text-[14px] font-medium tracking-[-0.02em] text-[#8f9097]">Notifications</div>
          </div>

          <button type="button" className="text-[16px] font-medium tracking-[-0.02em] text-[#8a8b92] transition active:scale-[0.98]">
            Mark all read
          </button>
        </header>

        <div className="flex-1 px-[20px] pb-[36px] pt-[42px]">
          <section>
            <div className="mb-[12px] text-[15px] font-medium tracking-[-0.02em] text-[#85868d]">Featured</div>

            <button
              type="button"
              className="block w-full overflow-hidden rounded-[24px] bg-white text-left shadow-[0_18px_55px_rgba(15,23,42,0.055)] ring-1 ring-black/[0.035] transition active:scale-[0.992]"
            >
              <img
                src="/notifications/kivo-email-calendar.png"
                alt="Connect your email and calendar to Kivo"
                className="block h-auto w-full"
              />
            </button>
          </section>

          <div className="mt-[26px] space-y-[24px]">
            {notifications.map((group) => (
              <section key={group.group}>
                <div className="mb-[10px] text-[15px] font-medium tracking-[-0.02em] text-[#85868d]">{group.group}</div>
                <div className="space-y-[10px]">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={`${group.group}-${item.title}`}
                        type="button"
                        className="flex min-h-[76px] w-full items-center gap-[14px] rounded-[20px] bg-white px-[16px] py-[14px] text-left shadow-[0_12px_36px_rgba(15,23,42,0.035)] ring-1 ring-black/[0.025] transition active:scale-[0.992]"
                      >
                        <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[16px] bg-[#f7f7f8] text-[#16171a]">
                          <Icon size={22} strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold tracking-[-0.025em] text-[#18191d]">{item.title}</span>
                          <span className="mt-[2px] block text-[14px] leading-[1.35] tracking-[-0.02em] text-[#8b8c94]">{item.description}</span>
                        </span>
                        <span className="flex min-w-[52px] shrink-0 flex-col items-end gap-[18px] self-stretch pt-[2px] text-[13px] font-medium tracking-[-0.02em] text-[#8f9097]">
                          {item.time}
                          <span className={`h-[8px] w-[8px] rounded-full ${item.unread ? 'bg-[#6f7cff]' : 'bg-[#d8d9de]'}`} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <section className="pt-[34px] text-center">
            <div className="mx-auto flex h-[56px] w-[56px] items-center justify-center rounded-full bg-white shadow-[0_18px_44px_rgba(15,23,42,0.045)] ring-1 ring-black/[0.025]">
              <Bell size={22} strokeWidth={1.9} />
            </div>
            <div className="mt-[18px] text-[18px] font-semibold tracking-[-0.035em] text-[#1f2024]">You’re all caught up</div>
            <div className="mt-[4px] text-[14px] tracking-[-0.02em] text-[#9a9ba3]">No new notifications</div>
          </section>
        </div>
      </div>
    </main>
  );
}
