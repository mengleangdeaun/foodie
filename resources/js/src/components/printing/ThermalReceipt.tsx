import React, { forwardRef } from 'react';

interface Props { settings: any; order: any; }

export const ThermalReceipt = forwardRef<HTMLDivElement, Props>(({ settings, order }, ref) => {
    return (
        <div style={{ display: 'none' }}>
            <div 
                ref={ref} 
                className={settings.font_family} // POINT: Fixed font_family application
                style={{ 
                    width: '72mm', 
                    margin: '0 auto', 
                    padding: '10px', 
                    fontSize: `${settings.font_size_base}px`, 
                    color: '#000000', 
                    lineHeight: '1.2' 
                }}
            >
                {/* Logo Section - Absolute Center */}
                {settings.show_logo && settings.logo_url && (
                    <div style={{ textAlign: 'center', marginBottom: '10px', width: '100%' }}>
                        <img 
                            src={settings.logo_url} 
                            style={{ 
                                width: `${settings.logo_size}px`, 
                                height: 'auto',
                                display: 'block', 
                                margin: '0 auto' 
                            }} 
                        />
                    </div>
                )}

                {/* Header */}
                <div style={{ textAlign: 'center', width: '100%', marginBottom: '10px' }}>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: `${settings.font_size_base + 4}px`, fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {settings.store_name}
                    </h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: '10px' }}>
                        {settings.header_text}
                    </p>
                </div>

                <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                        {order.items?.map((item: any, i: number) => (
                            <tr key={i}>
                                <td style={{ verticalAlign: 'top', padding: '2px 0' }}>{item.quantity}x {item.product?.name}</td>
                                <td style={{ textAlign: 'right', verticalAlign: 'top' }}>${item.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

                {/* QR Code - Corrected Flex Alignment */}
                {settings.qr_code_url && (
                    <div style={{ 
                        marginTop: '20px', 
                        paddingTop: '15px', 
                        borderTop: '1px solid #eee',
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        width: '100%' 
                    }}>
                        <img 
                            src={settings.qr_code_url} 
                            style={{ 
                                width: `${settings.qr_code_size}px`, 
                                height: `${settings.qr_code_size}px`, 
                                imageRendering: 'pixelated', 
                                display: 'block', 
                                margin: '0 auto' 
                            }} 
                        />
                        <p style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '5px' }}>SCAN TO PAY</p>
                    </div>
                )}

                <footer style={{ textAlign: 'center', marginTop: '20px', fontSize: '9px', fontStyle: 'italic' }}>
                    {settings.footer_text}
                </footer>
            </div>
        </div>
    );
});