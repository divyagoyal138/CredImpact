export interface AnalyticsExportData {
  title: string;
  subtitle?: string;
  generatedBy?: string;
  dateStr?: string;
  metrics: {
    label: string;
    value: string | number;
    description?: string;
  }[];
  categoryBreakdown?: {
    name: string;
    value: number;
    percentage?: number;
  }[];
  tableData?: {
    [key: string]: any;
  }[];
}

// 1. Export as PDF via Print / Styled Document Window
export const exportAnalyticsToPDF = (data: AnalyticsExportData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }

  const dateStr = data.dateStr || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.title} - CredImpact Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          .logo { font-size: 24px; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px; }
          .logo span { color: #f59e0b; }
          .report-title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          .meta { text-align: right; font-size: 12px; color: #64748b; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
          .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
          .kpi-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; }
          .kpi-value { font-size: 24px; font-weight: 800; color: #0f172a; margin: 6px 0 2px 0; }
          .kpi-sub { font-size: 11px; color: #94a3b8; }
          .section-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 24px 0 12px 0; border-left: 4px solid #3b82f6; padding-left: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-weight: 700; color: #334155; border-bottom: 2px solid #cbd5e1; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
          @media print {
            body { padding: 20px; }
            .kpi-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Cred<span>Impact</span></div>
            <div class="report-title">${data.title}</div>
            ${data.subtitle ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${data.subtitle}</div>` : ''}
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${dateStr}</div>
            ${data.generatedBy ? `<div><strong>User:</strong> ${data.generatedBy}</div>` : ''}
            <div>Confidential Academic Report</div>
          </div>
        </div>

        <div class="kpi-grid">
          ${data.metrics.map(m => `
            <div class="kpi-card">
              <div class="kpi-label">${m.label}</div>
              <div class="kpi-value">${m.value}</div>
              ${m.description ? `<div class="kpi-sub">${m.description}</div>` : ''}
            </div>
          `).join('')}
        </div>

        ${data.categoryBreakdown && data.categoryBreakdown.length > 0 ? `
          <div class="section-title">Domain & Category Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Category / Domain</th>
                <th>Task Count</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              ${data.categoryBreakdown.map(c => `
                <tr>
                  <td><strong>${c.name}</strong></td>
                  <td>${c.value}</td>
                  <td>${c.percentage ? `${c.percentage}%` : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${data.tableData && data.tableData.length > 0 ? `
          <div class="section-title">Detailed Performance Records</div>
          <table>
            <thead>
              <tr>
                ${Object.keys(data.tableData[0]).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.tableData.map(row => `
                <tr>
                  ${Object.values(row).map(val => `<td>${val ?? ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          CredImpact Campus Ecosystem • Generated automatically on ${dateStr}
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// 2. Export as Word (.doc/.docx compatible HTML Word MIME)
export const exportAnalyticsToWord = (data: AnalyticsExportData) => {
  const dateStr = data.dateStr || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${data.title}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; }
        h1 { color: #2563eb; font-size: 20pt; margin-bottom: 2pt; }
        h2 { color: #0f172a; font-size: 14pt; border-bottom: 2pt solid #2563eb; padding-bottom: 4pt; margin-top: 18pt; }
        .meta-table { width: 100%; border: none; margin-bottom: 20pt; }
        .meta-table td { font-size: 9.5pt; color: #64748b; border: none; padding: 2pt; }
        .kpi-table { width: 100%; border-collapse: collapse; margin-bottom: 20pt; }
        .kpi-table td { background: #f8fafc; border: 1pt solid #cbd5e1; padding: 10pt; text-align: center; width: 25%; }
        .kpi-val { font-size: 18pt; font-weight: bold; color: #0f172a; margin-top: 4pt; }
        .kpi-lbl { font-size: 8.5pt; font-weight: bold; color: #64748b; text-transform: uppercase; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 10pt; }
        .data-table th { background: #2563eb; color: #ffffff; padding: 6pt; font-size: 10pt; text-align: left; }
        .data-table td { border: 1pt solid #e2e8f0; padding: 6pt; font-size: 9.5pt; }
        .data-table tr:nth-child(even) { background-color: #f8fafc; }
      </style>
    </head>
    <body>
      <h1>CredImpact - ${data.title}</h1>
      <p style="color: #64748b; font-size: 10pt;">${data.subtitle || 'Real-time performance analytics and task intelligence report'}</p>
      
      <table class="meta-table">
        <tr>
          <td><strong>Generated Date:</strong> ${dateStr}</td>
          <td style="text-align: right;"><strong>Author:</strong> ${data.generatedBy || 'System Administrator'}</td>
        </tr>
      </table>

      <h2>Executive Key Metrics</h2>
      <table class="kpi-table">
        <tr>
          ${data.metrics.map(m => `
            <td>
              <div class="kpi-lbl">${m.label}</div>
              <div class="kpi-val">${m.value}</div>
              ${m.description ? `<div style="font-size: 8pt; color: #94a3b8;">${m.description}</div>` : ''}
            </td>
          `).join('')}
        </tr>
      </table>

      ${data.categoryBreakdown && data.categoryBreakdown.length > 0 ? `
        <h2>Category & Domain Distribution</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Total Tasks</th>
              <th>Percentage Share</th>
            </tr>
          </thead>
          <tbody>
            ${data.categoryBreakdown.map(c => `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.value}</td>
                <td>${c.percentage ? `${c.percentage}%` : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      ${data.tableData && data.tableData.length > 0 ? `
        <h2>Detailed Activity Records</h2>
        <table class="data-table">
          <thead>
            <tr>
              ${Object.keys(data.tableData[0]).map(key => `<th>${key}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.tableData.map(row => `
              <tr>
                ${Object.values(row).map(val => `<td>${val ?? ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CredImpact_Analytics_Report_${Date.now()}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 3. Export as PowerPoint (.ppt/.pptx presentation formatted document)
export const exportAnalyticsToPowerPoint = (data: AnalyticsExportData) => {
  const dateStr = data.dateStr || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:p='urn:schemas-microsoft-microsoft-com:office:powerpoint' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${data.title} - Presentation</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
        .slide { background: #1e293b; border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; margin-bottom: 30px; height: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); page-break-after: always; display: flex; flex-direction: column; justify-content: space-between; }
        .slide-title { font-size: 24pt; font-weight: bold; color: #60a5fa; border-bottom: 2px solid #3b82f6; padding-bottom: 8pt; margin-bottom: 15pt; }
        .kpi-container { display: flex; gap: 15px; justify-content: space-between; margin-top: 20px; }
        .kpi-box { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 20px; text-align: center; flex: 1; }
        .kpi-num { font-size: 28pt; font-weight: bold; color: #38bdf8; margin: 10px 0; }
        .kpi-txt { font-size: 11pt; color: #94a3b8; text-transform: uppercase; font-weight: bold; }
        .slide-table { width: 100%; border-collapse: collapse; font-size: 11pt; }
        .slide-table th { background: #3b82f6; color: #fff; padding: 8pt; text-align: left; }
        .slide-table td { border-bottom: 1px solid #334155; padding: 8pt; color: #cbd5e1; }
        .slide-footer { font-size: 9pt; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #334155; padding-top: 10px; }
      </style>
    </head>
    <body>

      <!-- SLIDE 1: Title Slide -->
      <div class="slide">
        <div>
          <div style="font-size: 14pt; color: #f59e0b; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">CredImpact Campus Analytics</div>
          <div style="font-size: 32pt; font-weight: bold; color: #ffffff; margin-top: 20px;">${data.title}</div>
          <div style="font-size: 14pt; color: #94a3b8; margin-top: 10px;">${data.subtitle || 'Executive Intelligence & Performance Summary Slide Deck'}</div>
        </div>
        <div class="slide-footer">
          <div>Prepared for: ${data.generatedBy || 'Campus Administrator'}</div>
          <div>Date: ${dateStr}</div>
        </div>
      </div>

      <!-- SLIDE 2: KPI Metrics -->
      <div class="slide">
        <div>
          <div class="slide-title">Executive Key Performance Indicators</div>
          <div class="kpi-container">
            ${data.metrics.map(m => `
              <div class="kpi-box">
                <div class="kpi-txt">${m.label}</div>
                <div class="kpi-num">${m.value}</div>
                <div style="font-size: 9pt; color: #64748b;">${m.description || ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="slide-footer">
          <div>CredImpact System Analytics</div>
          <div>Slide 2</div>
        </div>
      </div>

      <!-- SLIDE 3: Category & Data Breakdown -->
      ${data.categoryBreakdown && data.categoryBreakdown.length > 0 ? `
        <div class="slide">
          <div>
            <div class="slide-title">Category & Domain Distribution</div>
            <table class="slide-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Task Volume</th>
                  <th>Distribution Share</th>
                </tr>
              </thead>
              <tbody>
                ${data.categoryBreakdown.slice(0, 6).map(c => `
                  <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.value}</td>
                    <td>${c.percentage ? `${c.percentage}%` : 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="slide-footer">
            <div>CredImpact System Analytics</div>
            <div>Slide 3</div>
          </div>
        </div>
      ` : ''}

    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], { type: 'application/vnd.ms-powerpoint' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CredImpact_Analytics_Presentation_${Date.now()}.ppt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 4. Export as CSV
export const exportAnalyticsToCSV = (data: AnalyticsExportData) => {
  let csvContent = `data:text/csv;charset=utf-8,`;
  csvContent += `"CredImpact Analytics Report"\n`;
  csvContent += `"Title","${data.title}"\n`;
  csvContent += `"Date","${data.dateStr || new Date().toLocaleDateString()}"\n\n`;

  csvContent += `"KPI Metrics"\n"Metric Name","Value"\n`;
  data.metrics.forEach(m => {
    csvContent += `"${m.label}","${m.value}"\n`;
  });

  if (data.tableData && data.tableData.length > 0) {
    csvContent += `\n"Detailed Data Records"\n`;
    const headers = Object.keys(data.tableData[0]);
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

    data.tableData.forEach(row => {
      csvContent += headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `CredImpact_Analytics_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
