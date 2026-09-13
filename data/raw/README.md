# `data/raw` folder

This folder is intended for **raw data** related to the company: dumps, exports, sample files, event samples, or untransformed datasets.

- **Main purpose**: serve as a landing zone or reference for original data before pipelines process it.
- **Recommendation**: document each dataset’s origin, format, expected size, privacy/PII considerations, and how it is versioned (ideally avoiding sensitive data in the repository).

For the incident analysis assignment, the canonical test CSV lives at `scripts/incidents-brasaland.csv` (alongside `analyze.py`). A copy may still exist here for historical reference.

> _Spanish version: [README.es.md](./README.es.md)._
