/** Landscape e-ticket print styles (matches .cet-* component). */
export const TICKET_PRINT_CSS = `
  @page {
    size: 200mm 85mm landscape;
    margin: 4mm;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
  }

  body {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: #0f172a;
    background: #fff;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .ticket-print-shell {
    width: 192mm;
    height: 77mm;
    margin: 0 auto;
  }

  .cet-ticket {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 77mm;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    box-shadow: none;
  }

  .cet-brand {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 26mm;
    flex-shrink: 0;
    padding: 5mm 3mm;
    background: linear-gradient(165deg, #663399 0%, #1e1b4b 100%);
    color: #fff;
  }

  .cet-brand-logo {
    font-size: 11pt;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #f3ea28;
  }

  .cet-brand-tag {
    margin-top: 2mm;
    font-size: 7pt;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .cet-brand-status {
    margin-top: auto;
    padding: 1.5mm 2mm;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.12);
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-align: center;
    text-transform: uppercase;
  }

  .cet-brand-status--paid {
    background: rgba(243, 234, 40, 0.2);
    color: #f3ea28;
  }

  .cet-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 5mm 5mm 4mm;
  }

  .cet-movie-title {
    margin: 0;
    font-size: 13pt;
    font-weight: 800;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .cet-meta-line {
    margin: 1.5mm 0 0;
    font-size: 8pt;
    line-height: 1.35;
    color: #64748b;
  }

  .cet-meta-dot {
    margin: 0 1.5mm;
    opacity: 0.55;
  }

  .cet-info-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 3mm;
    margin-top: 3mm;
    padding-top: 3mm;
    border-top: 1px dashed #e2e8f0;
  }

  .cet-info-label {
    display: block;
    font-size: 6.5pt;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #94a3b8;
  }

  .cet-info-value {
    display: block;
    margin-top: 1mm;
    font-size: 10pt;
    font-weight: 700;
    line-height: 1.2;
  }

  .cet-info-value--seats {
    font-size: 11pt;
    letter-spacing: 0.06em;
  }

  .cet-info-value--total {
    font-size: 11pt;
    color: #663399;
  }

  .cet-snacks {
    margin: 2mm 0 0;
    font-size: 7pt;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cet-footer-meta {
    margin-top: 2mm;
    font-size: 6.5pt;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cet-perforation {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2.5mm;
    width: 5mm;
    flex-shrink: 0;
    background: repeating-linear-gradient(
      to bottom,
      #fff,
      #fff 2mm,
      #e2e8f0 2mm,
      #e2e8f0 3mm
    );
  }

  .cet-perforation-dot {
    width: 2mm;
    height: 2mm;
    border-radius: 50%;
    background: #fff;
    box-shadow: inset 0 0 0 0.3mm #cbd5e1;
  }

  .cet-stub {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 38mm;
    flex-shrink: 0;
    padding: 4mm 3mm;
    background: #f8fafc;
    text-align: center;
  }

  .cet-qr-wrap {
    padding: 2mm;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
  }

  .cet-qr-wrap svg {
    display: block;
    width: 28mm !important;
    height: 28mm !important;
  }

  .cet-stub-hint {
    margin: 2mm 0 0;
    font-size: 5.5pt;
    line-height: 1.3;
    color: #64748b;
  }

  .cet-stub-seats {
    margin: 1.5mm 0 0;
    font-size: 9pt;
    font-weight: 800;
    letter-spacing: 0.08em;
  }
`;

export function printTicketHtml(ticketInnerHtml: string, onFallback: () => void): void {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>CiNect Ticket</title>
    <style>${TICKET_PRINT_CSS}</style>
  </head>
  <body>
    <div class="ticket-print-shell">${ticketInnerHtml}</div>
  </body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    onFallback();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const runPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(() => iframe.remove(), 1000);
    }
  };

  if (iframe.contentWindow?.document.readyState === "complete") {
    window.setTimeout(runPrint, 200);
  } else {
    iframe.onload = () => window.setTimeout(runPrint, 200);
  }
}
