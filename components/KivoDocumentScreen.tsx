'use client';

import { useState } from 'react';
import { ArrowLeft, Download, FileText, MoreHorizontal, Share2 } from 'lucide-react';

type KivoDocument = { title?: string; content?: string; type?: string };
type Props = { document: KivoDocument; onClose: () => void };
type InlinePart = { text: string; bold: boolean };

function safeFileName(name: string) {
  return (name || 'kivo-document').replace(/[^a-z0-9åäö\-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'kivo-document';
}

function downloadTextFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function markdownToPlainText(markdown: string) {
  return markdown.replace(/^#{1,6}\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/^[-*•]\s+/gm, '• ').trim();
}

function parseInlineMarkdown(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    if (match[1]) parts.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), bold: false });
  return parts.length ? parts : [{ text, bold: false }];
}

function InlineMarkdown({ text }: { text: string }) {
  return <>{parseInlineMarkdown(text).map((part, index) => part.bold ? <strong key={`${part.text}-${index}`} className="font-semibold text-[#202124]">{part.text}</strong> : <span key={`${part.text}-${index}`}>{part.text}</span>)}</>;
}

function stripHeading(line: string) { return line.replace(/^#{1,6}\s*/, '').replace(/^\*\*(.*?)\*\*$/, '$1').trim(); }

function MarkdownLine({ line, index }: { line: string; index: number }) {
  const trimmed = line.trim();
  if (!trimmed) return <div key={index} className="h-[18px]" />;
  const h1 = trimmed.match(/^#\s*(.+)$/);
  if (h1) return <h1 key={index} className="mb-[18px] mt-[4px] text-[38px] font-semibold leading-[1.08] tracking-[-0.06em] text-[#25262a]"><InlineMarkdown text={h1[1]} /></h1>;
  const h2 = trimmed.match(/^##\s*(.+)$/);
  if (h2) return <h2 key={index} className="mb-[14px] mt-[34px] text-[27px] font-semibold leading-[1.14] tracking-[-0.05em] text-[#28292d]"><InlineMarkdown text={h2[1]} /></h2>;
  const h3 = trimmed.match(/^###\s*(.+)$/);
  if (h3) return <h3 key={index} className="mb-[10px] mt-[24px] text-[22px] font-semibold leading-[1.16] tracking-[-0.045em] text-[#2b2c30]"><InlineMarkdown text={h3[1]} /></h3>;
  const bullet = trimmed.match(/^[-*•]\s*(.+)$/);
  if (bullet) return <div key={index} className="mb-[8px] flex gap-[10px] text-[20px] leading-[1.42] tracking-[-0.035em] text-[#303136]"><span className="mt-[12px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#303136]" /><span><InlineMarkdown text={bullet[1]} /></span></div>;
  const numbered = trimmed.match(/^(\d+)[.)]\s*(.+)$/);
  if (numbered) return <div key={index} className="mb-[8px] flex gap-[10px] text-[20px] leading-[1.42] tracking-[-0.035em] text-[#303136]"><span className="min-w-[25px] font-semibold text-[#202124]">{numbered[1]}.</span><span><InlineMarkdown text={numbered[2]} /></span></div>;
  const boldOnly = trimmed.match(/^\*\*(.+)\*\*:?$/);
  if (boldOnly && trimmed.length < 95) return <h2 key={index} className="mb-[12px] mt-[30px] text-[27px] font-semibold leading-[1.14] tracking-[-0.05em] text-[#28292d]"><InlineMarkdown text={stripHeading(trimmed)} /></h2>;
  return <p key={index} className="mb-[14px] text-[21px] leading-[1.42] tracking-[-0.04em] text-[#303136]"><InlineMarkdown text={line} /></p>;
}

export function KivoDocumentScreen({ document, onClose }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = document.title || 'Kivo document';
  const content = document.content || '';
  const fileBase = safeFileName(title);
  const contentWithoutDuplicateTitle = content.replace(/^#?\s*#{0,2}\s*.*\n/, content.startsWith('#') ? '' : content);

  function downloadMarkdown() { downloadTextFile(`${fileBase}.md`, `# ${title}\n\n${content}`, 'text/markdown;charset=utf-8'); setMenuOpen(false); }
  function downloadDocx() { downloadTextFile(`${fileBase}.doc`, `${title}\n\n${markdownToPlainText(content)}`, 'application/msword;charset=utf-8'); setMenuOpen(false); }
  function downloadPdf() { setMenuOpen(false); window.print(); }
  async function shareDocument() {
    setMenuOpen(false);
    if (navigator.share) await navigator.share({ title, text: markdownToPlainText(content) });
    else await navigator.clipboard.writeText(`${title}\n\n${markdownToPlainText(content)}`);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#f3f3f5]">
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col bg-[#f3f3f5]">
        <header className="sticky top-0 z-10 flex h-[76px] shrink-0 items-center gap-[14px] bg-[#f3f3f5]/92 px-[18px] pt-[10px] backdrop-blur-xl">
          <button type="button" onClick={onClose} className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#1f2024] active:bg-black/[0.04]"><ArrowLeft size={25} strokeWidth={2.3} /></button>
          <div className="min-w-0 flex-1 truncate text-[20px] font-semibold tracking-[-0.045em] text-[#28292d]">{title}</div>
          <button type="button" onClick={shareDocument} className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#1f2024] active:bg-black/[0.04]"><Share2 size={22} strokeWidth={2.2} /></button>
          <button type="button" onClick={() => setMenuOpen(true)} className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#1f2024] active:bg-black/[0.04]"><MoreHorizontal size={25} strokeWidth={2.2} /></button>
        </header>

        <article className="flex-1 overflow-y-auto px-[28px] pb-[48px] pt-[12px]">
          <h1 className="mb-[22px] text-[39px] font-semibold leading-[1.08] tracking-[-0.065em] text-[#25262a]">{title}</h1>
          <div>{contentWithoutDuplicateTitle.split('\n').map((line, index) => <MarkdownLine key={`${index}-${line}`} line={line} index={index} />)}</div>
        </article>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/25 px-[14px] pb-[18px]" onClick={() => setMenuOpen(false)}>
          <div className="w-full max-w-[430px] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={downloadPdf} className="flex w-full items-center justify-between px-[22px] py-[18px] text-left text-[20px] tracking-[-0.035em] text-[#202124]"><span>Download as PDF</span><FileText size={22} /></button>
            <div className="h-px bg-black/[0.08]" />
            <button type="button" onClick={downloadDocx} className="flex w-full items-center justify-between px-[22px] py-[18px] text-left text-[20px] tracking-[-0.035em] text-[#202124]"><span>Download as DOCX</span><FileText size={22} /></button>
            <div className="h-px bg-black/[0.08]" />
            <button type="button" onClick={downloadMarkdown} className="flex w-full items-center justify-between px-[22px] py-[18px] text-left text-[20px] tracking-[-0.035em] text-[#202124]"><span>Download as Markdown</span><Download size={23} /></button>
            <div className="h-px bg-black/[0.08]" />
            <button type="button" onClick={shareDocument} className="flex w-full items-center justify-between px-[22px] py-[18px] text-left text-[20px] tracking-[-0.035em] text-[#202124]"><span>Share</span><Share2 size={23} /></button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
