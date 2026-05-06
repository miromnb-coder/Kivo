'use client';

export type KivoBrowserPreviewAction =
  | 'open'
  | 'search'
  | 'read'
  | 'click'
  | 'type'
  | 'scroll'
  | 'extract'
  | 'done';

export type KivoBrowserPreview = {
  url?: string;
  title?: string;
  action?: KivoBrowserPreviewAction;
  actionLabel?: string;
  screenshotUrl?: string;
  highlight?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  cursor?: {
    x: number;
    y: number;
  };
  status?: 'idle' | 'running' | 'done';
};

type Props = {
  preview?: KivoBrowserPreview | null;
};

const ENABLE_KIVO_BROWSER_PREVIEW = false;

export function KivoMiniBrowserPreview({ preview: _preview }: Props) {
  if (!ENABLE_KIVO_BROWSER_PREVIEW) return null;

  return null;
}
