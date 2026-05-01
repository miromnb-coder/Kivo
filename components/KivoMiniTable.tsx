'use client';

type KivoMiniTableData = {
  title?: string;
  columns?: string[];
  rows?: Array<Array<string | number | null | undefined>>;
};

type Props = {
  table?: KivoMiniTableData | null;
};

export function KivoMiniTable({ table }: Props) {
  const columns = table?.columns ?? [];
  const rows = table?.rows ?? [];

  if (!table || columns.length === 0 || rows.length === 0) return null;

  return (
    <div className="mt-[14px] overflow-hidden rounded-[18px] border border-black/[0.06] bg-white/70 shadow-[0_8px_22px_rgba(15,23,42,0.035)]">
      {table.title ? (
        <div className="border-b border-black/[0.055] px-[13px] py-[10px] text-[13px] font-semibold tracking-[-0.025em] text-[#202024]">
          {table.title}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[315px] border-collapse text-left text-[12.5px] tracking-[-0.02em]">
          <thead>
            <tr className="border-b border-black/[0.055] text-[#898a91]">
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-[13px] py-[9px] font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.slice(0, 5).map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-black/[0.045] last:border-b-0">
                {columns.map((_, colIndex) => (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    className={`max-w-[170px] px-[13px] py-[10px] align-top ${
                      colIndex === 0 ? 'whitespace-nowrap text-[#73747b]' : 'text-[#24252a]'
                    } ${colIndex === 1 ? 'font-medium' : 'font-normal'}`}
                  >
                    <span className="line-clamp-2 break-words">
                      {row[colIndex] ?? '—'}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
