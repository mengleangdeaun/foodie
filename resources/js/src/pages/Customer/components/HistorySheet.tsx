import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, X, Clock, CheckCircle, ChefHat, Package } from "lucide-react";

interface HistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  orderHistory: any[];
  primaryColor: string;
  branch: any;
}

const HistorySheet = ({
  isOpen,
  onClose,
  orderHistory,
  primaryColor,
  branch
}: HistorySheetProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'cooking':
        return <ChefHat className="h-4 w-4" />;
      case 'ready':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'cooking':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 [&>button]:hidden">
        <div className="h-full flex flex-col">
          <div
            className="p-6 border-b"
            style={{
              borderColor: `${primaryColor}20`,
              backgroundColor: `${primaryColor}05`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: primaryColor }}
                >
                  Order History
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {orderHistory.length} past order{orderHistory.length !== 1 ? 's' : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                style={{ color: primaryColor }}
              >
                <X size={20} />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {orderHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <History className="h-8 w-8" style={{ color: primaryColor }} />
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  No orders yet
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Your order history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderHistory.map(order => (
                  <div
                    key={order.id}
                    className="rounded-xl p-4"
                    style={{
                      backgroundColor: `${primaryColor}05`,
                      border: `1px solid ${primaryColor}20`
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Order #{order.id}
                        </p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {new Date(order.date).toLocaleDateString()} • {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <Badge
                          className={`text-xs font-medium capitalize ${getStatusColor(order.status)}`}
                          style={{
                            borderColor: `${primaryColor}30`
                          }}
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <div className="space-y-2 mb-3">
                      {order.items && order.items.map((i: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">
                            {i.quantity}x {i.name}
                          </span>
                          {i.selectedSize && (
                            <span className="text-xs text-slate-500">
                              ({i.selectedSize.name})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Order Summary */}
                    <div className="space-y-1 text-sm">
                      {order.remark && (
                        <div className="text-slate-500 dark:text-slate-400 text-xs">
                          Note: {order.remark}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-3 border-t"
                        style={{ borderColor: `${primaryColor}20` }}>
                        <span className="font-medium">Total</span>
                        <span
                          className="font-bold"
                          style={{ color: primaryColor }}
                        >
                          ${order.total?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      {order.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          style={{
                            borderColor: primaryColor,
                            color: primaryColor
                          }}
                        >
                          Reorder
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        style={{
                          borderColor: `${primaryColor}50`,
                          color: primaryColor
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Statistics Footer */}
          {orderHistory.length > 0 && (
            <div className="p-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {orderHistory.length}
                  </div>
                  <div className="text-xs text-slate-500">Total Orders</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                    ${orderHistory.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">Total Spent</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {orderHistory.filter(o => o.status === 'completed').length}
                  </div>
                  <div className="text-xs text-slate-500">Completed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HistorySheet;