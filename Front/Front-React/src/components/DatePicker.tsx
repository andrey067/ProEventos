import * as Popover from "@radix-ui/react-popover";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

function parseIsoDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = parse(value.slice(0, 10), "yyyy-MM-dd", new Date());
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-muted"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function DatePicker({
  value,
  onChange,
  onBlur,
  id,
  name,
  className = "",
  placeholder = "Selecione a data",
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);
  const [month, setMonth] = useState<Date>(() => selected ?? new Date());

  // Keep calendar month aligned when form reset/patch loads a date (edit path).
  useEffect(() => {
    if (selected) setMonth(selected);
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        className="sr-only"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        tabIndex={-1}
        aria-hidden
      />
      <Popover.Root
        open={disabled ? false : open}
        onOpenChange={(next) => {
          if (!disabled) setOpen(next);
        }}
      >
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label="Abrir calendário"
            disabled={disabled}
            className={`inline-flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
          >
            <span className={selected ? "text-ink" : "text-muted"}>
              {selected
                ? format(selected, "dd/MM/yyyy", { locale: ptBR })
                : placeholder}
            </span>
            <CalendarIcon />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="z-50 rounded-[length:var(--radius-control)] border border-line bg-panel p-3 shadow-lg"
          >
            <DayPicker
              mode="single"
              locale={ptBR}
              selected={selected}
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                onChange(date ? format(date, "yyyy-MM-dd") : "");
                setOpen(false);
                onBlur?.();
              }}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
