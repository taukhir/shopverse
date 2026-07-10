function safeFilename(title: string) { return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'documentation'; }

export function exportPageAsPdf() {
  window.print();
}

export function exportPageAsWord(title: string) {
  const article = document.querySelector('article')?.cloneNode(true) as HTMLElement | undefined;
  if (!article) return;
  article.querySelectorAll('button, .reading-metadata, [aria-label="Reader actions"], aside[aria-label="Documentation feedback"]').forEach((node) => node.remove());
  const styles = `
    @page { size: Letter; margin: 0.8in; }
    body { color:#17231f; font-family:Arial,sans-serif; font-size:11pt; line-height:1.55; }
    h1 { color:#104a3f; font-size:24pt; } h2 { border-bottom:1px solid #d7e1df; color:#176b5b; font-size:17pt; padding-bottom:5px; }
    h3 { color:#176b5b; font-size:13pt; } a { color:#176b5b; } code,pre { font-family:Consolas,monospace; }
    pre { background:#f4f7f6; border:1px solid #d7e1df; padding:10px; white-space:pre-wrap; }
    table { border-collapse:collapse; width:100%; } th,td { border:1px solid #cbd8d5; padding:6px; vertical-align:top; } th { background:#e6f3ef; }
    img,svg { height:auto; max-width:100%; } blockquote { border-left:4px solid #176b5b; margin-left:0; padding-left:12px; }
  `;
  const html = `<!doctype html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${title}</title><style>${styles}</style></head><body>${article.innerHTML}</body></html>`;
  const blob = new Blob(['\ufeff', html], {type: 'application/msword'});
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `${safeFilename(title)}.doc`; link.click(); URL.revokeObjectURL(url);
}
