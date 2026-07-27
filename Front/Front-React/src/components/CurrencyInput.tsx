import CurrencyInputField from "react-currency-input-field";

type CurrencyInputProps = {
  value?: number | null;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  className?: string;
  placeholder?: string;
};

export function CurrencyInput({
  value,
  onChange,
  onBlur,
  id,
  name,
  className = "",
  placeholder = "R$ 0,00",
}: CurrencyInputProps) {
  return (
    <CurrencyInputField
      id={id}
      name={name}
      className={className}
      placeholder={placeholder}
      intlConfig={{ locale: "pt-BR", currency: "BRL" }}
      decimalsLimit={2}
      decimalScale={2}
      allowNegativeValue={false}
      disableAbbreviations
      value={value ?? undefined}
      onBlur={onBlur}
      onValueChange={(_value, _name, values) => {
        const next = values?.float;
        if (next == null || Number.isNaN(next)) {
          onChange(undefined);
          return;
        }
        onChange(next);
      }}
    />
  );
}
