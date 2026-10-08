import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports group expense data as CSV format
 */
export const exportGroupToCSV = (group, expenses, balances, settlements) => {
  let csvContent = `data:text/csv;charset=utf-8,`;

  // Group Details
  csvContent += `SplitEase Group Report\r\n`;
  csvContent += `Group Name:,${group.name}\r\n`;
  csvContent += `Currency:,${group.currency}\r\n`;
  csvContent += `Export Date:,${new Date().toLocaleDateString()}\r\n\r\n`;

  // Expenses Section
  csvContent += `EXPENSES\r\n`;
  csvContent += `Date,Title,Category,Amount (${group.currency}),Paid By,Participants Count\r\n`;

  expenses.forEach((e) => {
    const row = [
      new Date(e.date).toLocaleDateString(),
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.amount.toFixed(2),
      `"${e.paidBy?.name || 'Unknown'}"`,
      e.participants?.length || 0,
    ];
    csvContent += row.join(',') + '\r\n';
  });

  csvContent += '\r\n';

  // Balances Section
  csvContent += `MEMBER BALANCES\r\n`;
  csvContent += `Member,Total Paid,Total Share,Settled Paid,Settled Received,Net Balance,Status\r\n`;

  balances.forEach((b) => {
    const row = [
      `"${b.user.name}"`,
      b.totalPaid.toFixed(2),
      b.totalShare.toFixed(2),
      b.settledPaid.toFixed(2),
      b.settledReceived.toFixed(2),
      b.netBalance.toFixed(2),
      b.status,
    ];
    csvContent += row.join(',') + '\r\n';
  });

  csvContent += '\r\n';

  // Settlements Section
  csvContent += `SETTLEMENTS\r\n`;
  csvContent += `Date,From,To,Amount,Status\r\n`;

  settlements.forEach((s) => {
    const row = [
      new Date(s.createdAt).toLocaleDateString(),
      `"${s.from?.name || 'Unknown'}"`,
      `"${s.to?.name || 'Unknown'}"`,
      s.amount.toFixed(2),
      s.status,
    ];
    csvContent += row.join(',') + '\r\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${group.name.replace(/\s+/g, '_')}_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports group expense data as a styled PDF report
 */
export const exportGroupToPDF = (group, expenses, balances, settlements, totalSpending) => {
  const doc = new jsPDF();

  // Brand Header
  doc.setFillColor(16, 185, 129); // Emerald primary
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SplitEase - Group Financial Report', 14, 16);

  // Group Summary Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.text(`Group: ${group.name}`, 14, 34);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Exported on: ${new Date().toLocaleDateString()} | Currency: ${group.currency}`, 14, 40);
  doc.text(`Total Group Expenditure: ${group.currency} ${totalSpending.toLocaleString('en-IN')}`, 14, 46);

  let startY = 52;

  // Expenses Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Expenses Ledger', 14, startY);

  const expenseRows = expenses.map((e) => [
    new Date(e.date).toLocaleDateString(),
    e.title,
    e.category,
    e.paidBy?.name || 'N/A',
    `${group.currency} ${e.amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: startY + 4,
    head: [['Date', 'Title', 'Category', 'Paid By', 'Amount']],
    body: expenseRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  startY = doc.lastAutoTable.finalY + 12;

  // Balances Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Member Balances Summary', 14, startY);

  const balanceRows = balances.map((b) => [
    b.user.name,
    `${group.currency} ${b.totalPaid.toFixed(2)}`,
    `${group.currency} ${b.totalShare.toFixed(2)}`,
    `${group.currency} ${b.netBalance.toFixed(2)}`,
    b.status,
  ]);

  autoTable(doc, {
    startY: startY + 4,
    head: [['Member', 'Total Paid', 'Total Share', 'Net Balance', 'Status']],
    body: balanceRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  startY = doc.lastAutoTable.finalY + 12;

  // Settlements Table
  if (settlements.length > 0) {
    if (startY > 230) {
      doc.addPage();
      startY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Settlement History', 14, startY);

    const settlementRows = settlements.map((s) => [
      new Date(s.createdAt).toLocaleDateString(),
      `${s.from?.name} -> ${s.to?.name}`,
      `${group.currency} ${s.amount.toFixed(2)}`,
      s.status,
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Date', 'Transfer', 'Amount', 'Status']],
      body: settlementRows,
      theme: 'grid',
      headStyles: { fillColor: [100, 116, 139], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  // Save the PDF
  doc.save(`${group.name.replace(/\s+/g, '_')}_Report.pdf`);
};
