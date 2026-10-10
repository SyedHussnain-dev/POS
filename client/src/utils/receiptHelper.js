import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReceiptPDF = (receipt, action = 'download') => {
  // Receipt paper is usually 80mm width.
  // 80mm = ~3.15 inches
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 250], // 80mm width, enough height for many items
  });

  doc.setFontSize(14);
  doc.text('POS SYSTEM', 40, 10, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`Receipt #: ${receipt.receiptNumber}`, 40, 16, { align: 'center' });
  
  const date = new Date(receipt.createdAt).toLocaleString('en-US');
  doc.text(`Date: ${date}`, 40, 20, { align: 'center' });

  // Items table
  const tableData = receipt.items.map(item => [
    item.name,
    item.qty.toString(),
    `$${item.price.toFixed(2)}`,
    `$${item.total.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 28,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
    headStyles: { fontStyle: 'bold', halign: 'left' },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 16, halign: 'right' },
    },
    margin: { left: 4, right: 4 },
  });

  // Calculate position after table
  let finalY = 60;
  if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
    finalY = doc.lastAutoTable.finalY + 5;
  } else if (doc.autoTable.previous && doc.autoTable.previous.finalY) {
    finalY = doc.autoTable.previous.finalY + 5;
  }

  doc.setFontSize(9);
  doc.text('Subtotal:', 4, finalY);
  doc.text(`$${receipt.subtotal.toFixed(2)}`, 76, finalY, { align: 'right' });
  finalY += 5;

  if (receipt.discount > 0) {
    doc.text('Discount:', 4, finalY);
    doc.text(`-$${receipt.discount.toFixed(2)}`, 76, finalY, { align: 'right' });
    finalY += 5;
  }

  doc.text('Tax (8%):', 4, finalY);
  doc.text(`$${receipt.tax.toFixed(2)}`, 76, finalY, { align: 'right' });
  finalY += 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', 4, finalY);
  doc.text(`$${receipt.grandTotal.toFixed(2)}`, 76, finalY, { align: 'right' });
  finalY += 5;

  doc.setFont('helvetica', 'normal');
  doc.text(`Payment: ${receipt.paymentMethod.toUpperCase()}`, 40, finalY + 4, { align: 'center' });
  doc.text('Thank you for your business!', 40, finalY + 12, { align: 'center' });

  if (action === 'print') {
    doc.autoPrint();
    const blob = doc.output('bloburl');
    window.open(blob, '_blank');
  } else {
    doc.save(`receipt-${receipt.receiptNumber}.pdf`);
  }
};
