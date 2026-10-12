import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReceiptPDF = (receipt, action = 'download') => {
  try {
    if (!receipt) {
      console.error('generateReceiptPDF: receipt is null or undefined');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 250],
    });

    doc.setFontSize(14);
    doc.text('POS SYSTEM', 40, 10, { align: 'center' });

    doc.setFontSize(9);
    const orderNumber = receipt.orderNumber || receipt.receiptNumber || 'Pending';
    doc.text(`Order #: ${orderNumber}`, 40, 16, { align: 'center' });

    const date = receipt.createdAt ? new Date(receipt.createdAt).toLocaleString('en-US') : new Date().toLocaleString('en-US');
    doc.text(`Date: ${date}`, 40, 20, { align: 'center' });

    const items = Array.isArray(receipt.items) ? receipt.items : [];
    const tableData = items.map((item) => [
      String(item.name || 'Item'),
      String(item.quantity ?? item.qty ?? 0),
      `$${Number(item.unitPrice ?? item.price ?? 0).toFixed(2)}`,
      `$${Number(item.subtotal ?? item.total ?? 0).toFixed(2)}`,
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

    let finalY = 60;
    if (doc.lastAutoTable && typeof doc.lastAutoTable.finalY === 'number') {
      finalY = doc.lastAutoTable.finalY + 5;
    }

    const subtotal = Number(receipt.subtotal ?? 0);
    const discount = Number(receipt.discountTotal ?? receipt.discount ?? 0);
    const tax = Number(receipt.taxTotal ?? receipt.tax ?? 0);
    const grandTotal = Number(receipt.grandTotal ?? 0);

    doc.setFontSize(9);
    doc.text('Subtotal:', 4, finalY);
    doc.text(`$${subtotal.toFixed(2)}`, 76, finalY, { align: 'right' });
    finalY += 5;

    if (discount > 0) {
      doc.text('Discount:', 4, finalY);
      doc.text(`-$${discount.toFixed(2)}`, 76, finalY, { align: 'right' });
      finalY += 5;
    }

    doc.text('Tax:', 4, finalY);
    doc.text(`$${tax.toFixed(2)}`, 76, finalY, { align: 'right' });
    finalY += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 4, finalY);
    doc.text(`$${grandTotal.toFixed(2)}`, 76, finalY, { align: 'right' });
    finalY += 5;

    doc.setFont('helvetica', 'normal');
    let paymentSummary = 'N/A';
    if (Array.isArray(receipt.payments) && receipt.payments.length > 0) {
      paymentSummary = receipt.payments
        .map((payment) => `${payment.method}: $${Number(payment.amount || 0).toFixed(2)}`)
        .join(' \u2022 ');
    } else if (receipt.paymentMethod) {
      paymentSummary = String(receipt.paymentMethod).toUpperCase();
    }
    doc.text(`Payment: ${paymentSummary}`, 40, finalY + 4, { align: 'center', maxWidth: 70 });
    doc.text('Thank you for your business!', 40, finalY + 12, { align: 'center' });

    if (action === 'print') {
      doc.autoPrint();
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    } else {
      doc.save(`receipt-${orderNumber}.pdf`);
    }
  } catch (err) {
    console.error('generateReceiptPDF error:', err);
  }
};
