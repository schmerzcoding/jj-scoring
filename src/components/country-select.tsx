"use client";

import { Select } from "@/components/ui/select";
import { countrySelectOptions } from "@/lib/countries";

export function CountrySelect({
  label = "Country",
  value,
  onChange,
  required,
}: {
  label?: string;
  value: string;
  onChange: (code: string) => void;
  required?: boolean;
}) {
  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={countrySelectOptions(!required)}
      required={required}
    />
  );
}
