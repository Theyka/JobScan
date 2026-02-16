import json
from pathlib import Path

FILE = Path(__file__).with_name("jobsearch_az.json")

with FILE.open("r", encoding="utf-8") as f:
    jobs = json.load(f)

if not isinstance(jobs, list) or not jobs:
    print("Invalid or empty JSON list")
    raise SystemExit(1)

expected_keys = set(jobs[0].keys())
mismatches = 0

for i, job in enumerate(jobs, start=1):
    if not isinstance(job, dict):
        print(f"Index {i}: not an object")
        mismatches += 1
        continue

    keys = set(job.keys())
    if keys != expected_keys:
        print(f"Index {i}, id={job.get('id')}")
        print(f"  missing: {sorted(expected_keys - keys)}")
        print(f"  extra: {sorted(keys - expected_keys)}")
        mismatches += 1

if mismatches == 0:
    print("All jobs have the same keys")
else:
    print(f"Found {mismatches} mismatched job(s)")
