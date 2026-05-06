# Cached external data

## `ls_classes.json`

LotusScript class reference data, sourced from
[OpenNTF/ls-classmap](https://github.com/OpenNTF/ls-classmap)
(`develop` branch, `src/main/resources/WebContent/data/ls_classes.json`).

Used by `scripts/coverage-report.ts` to know what the full class
catalogue looks like. 97 classes, each with `docUrl` plus full
property/method/event lists.

**License**: Apache 2.0 (the application code) plus HCL Domino 14.5.1
documentation metadata (each entry's `docUrl` and descriptive text
originate from HCL's official docs). See the OpenNTF repo for full
attribution.

**To refresh**:

```bash
curl -sL "https://raw.githubusercontent.com/OpenNTF/ls-classmap/develop/src/main/resources/WebContent/data/ls_classes.json" \
  -o data/ls_classes.json
```

OpenNTF updates this irregularly; refreshing once a quarter (or when a
new HCL Domino major version ships and the upstream catalogue is
rebuilt) is plenty.
