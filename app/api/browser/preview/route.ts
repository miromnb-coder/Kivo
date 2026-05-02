import { NextResponse } from 'next/server';
import chromium from '@sparticuz/chromium';
import { chromium as playwright } from 'playwright-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isSafeUrl(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname;

    if (!['http:', 'https:'].includes(u.protocol)) return false;

    if (
      host === 'localhost' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('172.') ||
      host.includes('internal')
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || !isSafeUrl(url)) {
      return NextResponse.json({ error: 'Invalid or unsafe URL' }, { status: 400 });
    }

    const browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

    const title = await page.title();

    const screenshot = await page.screenshot({ type: 'png' });
    const base64 = Buffer.from(screenshot).toString('base64');

    await browser.close();

    return NextResponse.json({
      url,
      title,
      screenshotUrl: `data:image/png;base64,${base64}`,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Browser preview failed' }, { status: 500 });
  }
}
