const DURATION_PATTERN = /^(\d+)(s|m|h|d)$/i;

export function tokenDurationMs(value: string, fallback: string) {
  const candidate = value.trim() || fallback;
  const match = DURATION_PATTERN.exec(candidate);
  if (!match) return tokenDurationMs(fallback, '30d');

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier =
    unit === 's'
      ? 1_000
      : unit === 'm'
        ? 60_000
        : unit === 'h'
          ? 60 * 60_000
          : 24 * 60 * 60_000;
  return amount * multiplier;
}
