"use client";

interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

interface ParamControlsProps {
  params: ParamDef[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  onReset: () => void;
}

export function ParamControls({
  params,
  values,
  onChange,
  onReset,
}: ParamControlsProps) {
  return (
    <div className="mt-3 rounded-xl border border-[var(--lg-border)] bg-secondary/50 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Parameters
        </span>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-none px-2 py-0.5 rounded hover:bg-secondary"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {params.map((p) => {
          const val = values[p.key] ?? p.defaultValue;
          return (
            <div key={p.key} className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground whitespace-nowrap min-w-[120px]">
                {p.label}
              </label>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={val}
                onChange={(e) => onChange(p.key, parseFloat(e.target.value))}
                className="flex-1 h-1 accent-[#667eea] cursor-pointer"
              />
              <span className="text-xs font-mono text-muted-foreground w-10 text-right tabular-nums">
                {val.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function useParamState(defaults: Record<string, number>) {
  const [values, setValues] = useState(defaults);
  const onChange = (key: string, value: number) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const onReset = () => setValues(defaults);
  return { values, onChange, onReset };
}

// Need to import useState
import { useState } from "react";
