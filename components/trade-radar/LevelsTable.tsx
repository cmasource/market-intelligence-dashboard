"use client";

import type { TechnicalLevel } from "@/lib/technical/levels";

type LevelsTableProps = {
  supports: TechnicalLevel[];
  resistances: TechnicalLevel[];
};

function LevelRows({ title, levels }: { title: string; levels: TechnicalLevel[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45">
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Nivel</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Fuerza</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {levels.length ? levels.map((level) => (
              <tr key={`${title}-${level.type}-${level.level}`}>
                <td className="cma-metric px-4 py-3 text-white">{level.level}</td>
                <td className="px-4 py-3 text-slate-300">{level.type}</td>
                <td className="px-4 py-3 text-slate-300">{level.strength}</td>
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={3}>
                  Sin niveles trazables.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LevelsTable({ supports, resistances }: LevelsTableProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <LevelRows title="Soportes" levels={supports} />
      <LevelRows title="Resistencias" levels={resistances} />
    </section>
  );
}
