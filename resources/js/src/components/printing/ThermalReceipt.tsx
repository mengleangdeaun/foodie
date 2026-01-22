import React, { forwardRef } from 'react';

interface Props { 
  settings: any; 
  order: any;
  branch?: any;
}

export const ThermalReceipt = forwardRef<HTMLDivElement, Props>(({ settings, order, branch }, ref) => {
  const orderDate = order?.created_at ? new Date(order.created_at) : new Date();
  const currentDate = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const currentTime = orderDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      ref={ref} 
      className="thermal-receipt"
      style={{ 
        width: `${settings.paper_width || 80}mm`, 
        maxWidth: `${settings.paper_width || 80}mm`,
        margin: '0 auto', 
        padding: `${settings.margin_size || 10}px`,
        fontSize: `${settings.font_size_base || 12}px`, 
        color: settings.primary_color || '#000000', 
        lineHeight: '1.2',
        border: settings.show_border ? '1px solid #000' : 'none',
        backgroundColor: 'white',
        fontFamily: settings.font_family || 'monospace'
      }}
    >
      {/* Header Section */}
      {settings?.show_header && (
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: `${(settings.font_size_base || 12) + 2}px`, fontWeight: 'bold', textTransform: 'uppercase' }}>
            {settings.store_name || branch?.branch_name || 'STORE NAME'}
          </h1>
          {branch?.location && <p style={{ margin: '3px 0', fontSize: `${(settings.font_size_base || 12) - 1}px` }}>📍 {branch.location}</p>}
        </div>
      )}

      <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

      {/* Info Section */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date:</span>
          <span>{currentDate} {currentTime}</span>
        </div>
        {order?.order_code && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Order ID:</span>
            <span>{order.order_code}</span>
          </div>
        )}
        {order?.table_number && (
          <div style={{ marginTop: '5px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f5f5f5', padding: '3px', border: '1px solid #ddd' }}>
            🪑 Table: {order.table_number}
          </div>
        )}
      </div>

      {/* Items Table - Prices already include item-level discounts */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left', paddingBottom: '5px' }}>Item</th>
            <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Qty</th>
            <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order?.items?.map((item: any, i: number) => (
            <tr key={i} style={{ borderBottom: '1px dashed #ccc' }}>
              <td style={{ verticalAlign: 'top', padding: '4px 0', maxWidth: '60%', wordBreak: 'break-word' }}>
                <div style={{ fontWeight: 'bold' }}>{item.product?.name}</div>
                {item.remark && <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#666' }}>{item.remark}</div>}
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '4px 5px' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '4px 0', fontWeight: 'bold' }}>
                ${item.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div style={{ borderTop: '2px solid #000', paddingTop: '10px', marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>${order?.subtotal}</span>
        </div>
        
        {/* Only show discount row if there's an order-level discount (e.g., promo code) */}
        {parseFloat(order?.order_level_discount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'red' }}>
            <span>Order Discount:</span>
            <span>-${order.order_level_discount}</span>
          </div>
        )}

        {parseFloat(order?.tax_amount || 0) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{branch?.tax_name || 'Tax'} ({order?.tax_rate}%):</span>
            <span>${order.tax_amount}</span>
          </div>
        )}
        
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', 
          fontSize: `${(settings.font_size_base || 12) + 2}px`, 
          marginTop: '5px', borderTop: '1px dashed #000', paddingTop: '5px' 
        }}>
          <span>TOTAL:</span>
          <span>${order?.total || '0.00'}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', fontSize: '8px', marginTop: '10px', color: '#666' }}>
        Generated on {currentDate} at {currentTime}
      </div>
    </div>
  );
});

ThermalReceipt.displayName = 'ThermalReceipt';
export default ThermalReceipt;