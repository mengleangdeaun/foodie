import React, { forwardRef } from 'react';

interface Props {
  settings: any;
  order: any;
  branch?: any; // Branch data for address and tax info
}

export const ThermalReceipt = forwardRef<HTMLDivElement, Props>(({ settings, order, branch }, ref) => {
  // Format the current date and time
  const orderDate = order?.created_at ? new Date(order.created_at) : new Date();
  const currentDate = orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const currentTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate tax if branch has tax settings
  const calculateTax = () => {
    // Prefer the saved tax amount from the order if available
    if (order?.tax_amount !== undefined && order?.tax_amount !== null) {
      return parseFloat(order.tax_amount).toFixed(2);
    }

    // Fallback calculation if not in order (though it should be)
    if (branch?.tax_is_active && branch?.tax_rate && order?.subtotal) {
      const subtotal = parseFloat(order.subtotal) || 0;
      const taxRate = parseFloat(branch.tax_rate) || 0;
      return (subtotal * (taxRate / 100)).toFixed(2);
    }
    return '0.00';
  };

  const taxAmount = calculateTax();

  // Use className for print hiding instead of inline style to avoid blank print issue
  return (
    <div className="hidden print:block thermal-receipt-print">
      <div
        ref={ref}
        className={settings.font_family}
        style={{
          width: `${settings.paper_width || 80}mm`,
          maxWidth: `${settings.paper_width || 80}mm`,
          margin: '0 auto',
          padding: `${settings.margin_size || 10}px`,
          fontSize: `${settings.font_size_base || 12}px`,
          color: settings.primary_color || '#000000',
          lineHeight: '1.2',
          border: settings.show_border ? '1px solid #000' : 'none',
          backgroundColor: 'white'
        }}
      >
        {/* Logo Section */}
        {!!settings.show_logo && !!settings.logo_path && (
          <div style={{
            textAlign: 'center',
            marginBottom: '10px',
            width: '100%',
            display: settings.show_logo ? 'block' : 'none'
          }}>
            <img
              src={settings.logo_path ? `/storage/${settings.logo_path}` : settings.logo_url}
              style={{
                width: `${settings.logo_size || 80}px`,
                height: 'auto',
                maxWidth: '100%',
                display: 'block',
                margin: '0 auto',
                filter: 'grayscale(100%)' // Thermal printers typically don't print colors well
              }}
              alt="Logo"
            />
          </div>
        )}

        {/* Header Section */}
        {!!settings.show_header && (
          <div style={{
            textAlign: 'center',
            width: '100%',
            marginBottom: '10px',
            display: settings.show_header ? 'block' : 'none'
          }}>
            <h1 style={{
              margin: '0 0 5px 0',
              fontSize: `${(settings.font_size_base || 12) + 2}px`,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              fontFamily: settings.font_family
            }}>
              {settings.store_name || branch?.branch_name || 'STORE NAME'}
            </h1>

            {/* Branch Address */}
            {!!branch?.location && (
              <p style={{
                margin: '3px 0',
                fontSize: `${(settings.font_size_base || 12) - 1}px`,
                lineHeight: '1.1'
              }}>
                📍 {branch.location}
              </p>
            )}

            {/* Branch Contact */}
            {!!branch?.contact_phone && (
              <p style={{
                margin: '3px 0',
                fontSize: `${(settings.font_size_base || 12) - 1}px`
              }}>
                📞 {branch.contact_phone}
              </p>
            )}

            {!!settings.header_text && (
              <p style={{
                margin: '5px 0',
                whiteSpace: 'pre-line',
                fontSize: `${(settings.font_size_base || 12) - 1}px`
              }}>
                {settings.header_text}
              </p>
            )}
          </div>
        )}

        <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

        {/* Order Information */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Date:</span>
            <span>{currentDate} {currentTime}</span>
          </div>

          {!!settings.show_order_id && !!order?.order_code && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Order #:</span>
              <span>{order.order_code}</span>
            </div>
          )}

          {/* Table Number Section - Show if restaurant_table_id exists */}
          {!!settings.show_customer_info && !!order?.restaurant_table_id && (
            <div style={{
              marginTop: '5px',
              padding: '3px 5px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '3px'
            }}>
              <div style={{ fontWeight: 'bold', textAlign: 'center' }}>
                Table: {order.restaurant_table?.table_number || order.table_number || order.restaurant_table_id}
              </div>
            </div>
          )}

          {/* Delivery Partner - Show if delivery_partner_id exists */}
          {!!order?.delivery_partner_id && (
            <div style={{
              marginTop: '5px',
              padding: '3px 5px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '3px'
            }}>
              <div style={{ fontWeight: 'bold', textAlign: 'center' }}>
                Delivery: {order.delivery_partner?.name || 'Partner'}
              </div>
            </div>
          )}

        </div>

        {/* Items Table */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '15px'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', paddingBottom: '5px' }}>Item</th>
              <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Qty</th>
              <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Price</th>
              <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order?.items?.map((item: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px dashed #ccc' }}>
                <td style={{
                  verticalAlign: 'top',
                  padding: '4px 0',
                  maxWidth: '60%',
                  wordBreak: 'break-word'
                }}>
                  {item.product?.name}
                </td>
                <td style={{
                  textAlign: 'right',
                  verticalAlign: 'top',
                  padding: '4px 5px'
                }}>
                  {item.quantity || 1}
                </td>
                <td style={{
                  textAlign: 'right',
                  verticalAlign: 'top',
                  padding: '4px 5px'
                }}>
                  ${parseFloat(item.final_unit_price || item.product?.price || 0).toFixed(2)}
                </td>
                <td style={{
                  textAlign: 'right',
                  verticalAlign: 'top',
                  padding: '4px 0',
                  fontWeight: 'bold'
                }}>
                  ${parseFloat(item.item_total || item.total || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ borderTop: '2px solid #000', paddingTop: '10px', marginBottom: '15px' }}>
          {!!order?.subtotal && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              {/* Show subtotal minus item discounts */}
              <span>
                ${(parseFloat(order.subtotal) - parseFloat(order.item_discount_total || 0)).toFixed(2)}
              </span>
            </div>
          )}

          {/* Discounts - Order Level + Delivery Partner */}
          {(parseFloat(order?.order_level_discount || 0) > 0 || parseFloat(order?.delivery_partner_discount || 0) > 0) && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#d32f2f',
              marginBottom: '4px'
            }}>
              <span>Discount:</span>
              <span style={{ fontWeight: '600' }}>
                -${(parseFloat(order?.order_level_discount || 0) + parseFloat(order?.delivery_partner_discount || 0)).toFixed(2)}
              </span>
            </div>
          )}

          {/* Tax Section - Display if tax amount exists > 0 */}
          {parseFloat(taxAmount) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{branch?.tax_name || 'Tax'} ({order?.tax_rate || branch?.tax_rate || 0}%):</span>
              <span>${taxAmount}</span>
            </div>
          )}

          {!!order?.delivery_fee && parseFloat(order.delivery_fee) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery Fee:</span>
              <span>${parseFloat(order.delivery_fee).toFixed(2)}</span>
            </div>
          )}

          {!!order?.service_charge && parseFloat(order.service_charge) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Service Charge:</span>
              <span>${parseFloat(order.service_charge).toFixed(2)}</span>
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: `${(settings.font_size_base || 12) + 1}px`,
            marginTop: '5px',
            borderTop: '1px dashed #000',
            paddingTop: '5px'
          }}>
            <span>TOTAL:</span>
            <span>${parseFloat(order?.total || 0).toFixed(2)}</span>
          </div>

          {/* Payment Method */}
          {!!order?.payment_method && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '5px',
              fontStyle: 'italic'
            }}>
              <span>Payment:</span>
              <span>{order.payment_method}</span>
            </div>
          )}

          {/* Payment Status */}
          {!!order?.payment_status && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '2px'
            }}>
              <span>Status:</span>
              <span style={{
                fontWeight: 'bold',
                color: order.payment_status === 'paid' ? 'green' : 'red'
              }}>
                {order.payment_status === 'paid' ? '✅ PAID' : '❌ PENDING'}
              </span>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        {!!settings.show_qr && (!!settings.qr_code_path || !!settings.qr_code_url) && (
          <div style={{
            marginTop: '15px',
            paddingTop: '15px',
            borderTop: '1px dashed #000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}>
            <img
              src={settings.qr_code_path ? `/storage/${settings.qr_code_path}` : settings.qr_code_url}
              style={{
                width: `${settings.qr_code_size || 90}px`,
                height: `${settings.qr_code_size || 90}px`,
                imageRendering: 'crisp-edges',
                display: 'block',
                margin: '0 auto',
                filter: 'grayscale(100%)' // Thermal printers are typically monochrome
              }}
              alt="QR Code"
            />
            <p style={{
              fontSize: '9px',
              fontWeight: 'bold',
              marginTop: '5px',
              textAlign: 'center'
            }}>
              SCAN TO PAY
            </p>
          </div>
        )}

        {/* Footer Section */}
        {!!settings.show_footer && (
          <footer style={{
            textAlign: 'center',
            marginTop: '15px',
            fontSize: `${(settings.font_size_base || 12) - 1}px`,
            fontStyle: 'italic',
            paddingTop: '10px',
            borderTop: '1px dashed #000'
          }}>
            {settings.footer_text || 'Thank you for your purchase!'}
          </footer>
        )}


        {/* Default Footer Info */}
        <div style={{
          textAlign: 'center',
          fontSize: '8px',
          marginTop: '10px',
          color: '#666'
        }}>
          Generated on {currentDate} at {currentTime}
        </div>
      </div>
    </div>
  );
});

ThermalReceipt.displayName = 'ThermalReceipt';
export default ThermalReceipt;