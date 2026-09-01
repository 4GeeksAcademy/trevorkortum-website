# Rule: Multi-Currency and Locale Handling

Scope: always active

Brasaland operates in Colombia and Florida. Any code, UI copy, seed data, report, or API contract that handles money, dates, locations, people, or operational metrics must respect market-specific context.

## Requirements

- Represent money with both `amount` and `currency`; valid currencies are `COP` and `USD` unless a new market is explicitly approved.
- Use `es-CO` formatting for Colombia-facing values and `en-US` formatting for Florida-facing values.
- Never aggregate COP and USD into one total unless the conversion rate, source, timestamp, and target currency are visible in the data path.
- Keep language-sensitive copy ready for Spanish and English, even if the first UI is delivered in one language.
- Segment HR and compliance reporting by country.
- Use location names and market identifiers in demos so reviewers can verify that multi-market behavior is intentional.

## Verification

- Check UI screens for visible currency labels when money appears.
- Check seed data and examples for market, country, locale, and currency fields.
- Check summaries and dashboards for clear COP/USD separation or documented conversion metadata.
