# CodeQL alert 193: Actionlint download review

Reviewed 2026-11-06 (Asia/Calcutta).

**Disposition: confirmed false positive for the reviewed implementation.**
This is a local review record; the GitHub alert has not been dismissed.

## Exact scope

- Repository: `taukhir/shopverse`, PR #52.
- [Alert 193](https://github.com/taukhir/shopverse/security/code-scanning/193).
- Rule: `js/http-to-file-access` (Network data written to file).
- File: `.github/ci/lint-workflows.mjs`, the `writeFileSync(archive, bytes)` call.
- Reviewed alert instance: merge commit
  `fa6aa658d07a6a0b436b17051d606976cdb5520c`.

## Evidence and trust boundary

The script intentionally downloads and executes the pinned Actionlint 1.7.10
release as a CI build tool. CodeQL correctly traces network bytes into a file
write, but this finding does not account for the preceding integrity check:

1. The HTTPS release URL and version are fixed in source. The only filename
   choice is between fixed Windows/Linux x64 artifacts, based on the local OS.
   No PR title, event field, user URL or HTTP response filename controls it.
2. A failed HTTP response throws before reading/writing the archive.
3. The complete response is hashed with SHA-256 and compared with the matching
   digest pinned in source. A mismatch throws **before** temporary-directory
   creation, archive writing, extraction or execution. The expected digest does
   not come from that download or another network response.
4. The destination comes from `mkdtempSync` under the OS temporary root and the
   fixed artifact filename. Network data controls neither directory nor path.
5. Extraction and execution occur only after verification. Calls use argument
   arrays with `spawnSync`, without enabling a shell.

Both pinned platform digests were compared with the upstream
[1.7.10 checksum manifest](https://github.com/rhysd/actionlint/releases/download/v1.7.10/actionlint_1.7.10_checksums.txt)
and matched.

The bytes written are therefore restricted to the reviewed, checksum-pinned
artifact. Redirects or a changed upstream release cannot substitute different
bytes without causing checksum rejection. The alert is not evidence of an
arbitrary upload or an implanted downloader backdoor. This does not establish
that the upstream tool is free of vulnerabilities: trust in the selected release
and review of any future version/digest change remain necessary.

GitHub's [query guidance](https://codeql.github.com/codeql-query-help/javascript/js-http-to-file-access/)
calls for reviewing this intentional network-to-file behavior. Retain the
security-extended suite and the query for other files and future findings.

## Regression evidence and handling

`lint-workflows.test.mjs` exercises the actual downloader entry point with
controlled HTTP failure and tampered-body responses. Both must fail with the
expected error before any temporary directory or archive is created. Each test
also asserts the fixed release URL. These tests require no external network.

Validation passed: both new rejection tests, all 31 CI policy tests, the real
Windows download/checksum/extraction/Actionlint run and `git diff --check`.
The Linux binary was not executed locally; its pinned digest matches the upstream
manifest. Hosted CodeQL was not rerun, and this documentation/comment does not
clear or suppress the alert.

If an authorized maintainer dismisses alert **193**, use **false positive** with
the rationale above. This disposition applies only to this alert and the
reviewed guarded write. Do not exclude the file, disable the query, add a broad
SARIF filter or treat an inline comment as a CodeQL suppression. Re-review if
the URL, filename, digest source or verification/write/execution order changes.
