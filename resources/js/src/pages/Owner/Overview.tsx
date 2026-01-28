import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../util/api';
import { STATUS_CONFIG } from '../../constants/orderStatus';
import TimeFormat from '../../components/TimeFormat';
import { User as UserIcon, Store } from 'lucide-react';
import OrderTypeSpan from './components/OrderTypeSpan';

const OwnerDashboard = () => {
    const dispatch = useDispatch();
    const [data, setData] = useState({
        metrics: {
            total_branches: 0,
            today_orders: 0,
            today_sales: 0,
            most_active_branch: null as any
        },
        recent_orders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Restaurant Management'));

        api.get('/admin/owner/dashboard')
            .then(res => setData(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [dispatch]);

    return (
        <div className="pt-5 space-y-6">
            <div className="flex items-center justify-between">
                <h5 className="text-lg font-semibold dark:text-white-light">Restaurant Overview</h5>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {/* Total Branches */}
                {/* Total Branches */}
                <div className="panel bg-gradient-to-br from-blue-600 to-blue-400 text-white p-6 relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 font-medium text-sm tracking-wide uppercase">Total Branches</p>
                            <h4 className="text-4xl font-extrabold mt-2">{loading ? '...' : data.metrics.total_branches}</h4>
                        </div>
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-sm">
                            <Store className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="relative z-10 mt-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm border border-white/10">
                            Active Locations
                        </span>
                    </div>

                    {/* Decorative Background Elements */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-3xl opacity-50"></div>
                </div>

                {/* Sales Today */}
                <div className="panel bg-gradient-to-r from-violet-500 to-violet-400 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">Sales Today</div>
                    </div>
                    <div className="mt-5 flex items-center">
                        <div className="text-3xl font-bold">{loading ? '...' : `$${Number(data.metrics.today_sales).toFixed(2)}`}</div>
                    </div>
                </div>

                {/* Orders Today */}
                <div className="panel bg-gradient-to-r from-purple-500 to-purple-400 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">Orders Today</div>
                    </div>
                    <div className="mt-5 flex items-center">
                        <div className="text-3xl font-bold">{loading ? '...' : data.metrics.today_orders}</div>
                    </div>
                </div>

                {/* Most Active Branch */}
                <div className="panel bg-gradient-to-r from-fuchsia-500 to-fuchsia-400 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">Most Active Branch</div>
                    </div>
                    <div className="mt-5 flex flex-col">
                        {loading ? (
                            <div className="text-3xl font-bold">...</div>
                        ) : data.metrics.most_active_branch ? (
                            <>
                                <div className="text-2xl font-bold truncate">{data.metrics.most_active_branch.name}</div>
                                <div className="text-sm mt-1">{data.metrics.most_active_branch.count} orders today</div>
                            </>
                        ) : (
                            <div className="text-xl">No activity</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Global Orders */}
            <div className="panel">
                <div className="mb-5 flex items-center justify-between">
                    <h5 className="text-lg font-semibold dark:text-white-light">Recent Orders (All Branches)</h5>
                </div>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Branch</th>
                                <th>User</th>
                                <th>Time</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recent_orders.length > 0 ? (
                                data.recent_orders.map((order: any) => {
                                    const statusConfig = STATUS_CONFIG[order.status] || {
                                        bg: 'bg-gray-100',
                                        text: 'text-gray-600',
                                        label: order.status
                                    };

                                    return (
                                        <tr key={order.id}>
                                            <td className="font-semibold">{order.order_number}</td>
                                            <td>{order.branch_name}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <UserIcon size={16} />
                                                    <span className="font-medium">{order.user_name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <TimeFormat time={order.created_at} />
                                            </td>
                                            <td>${order.total.toFixed(2)}</td>
                                            <td>
                                                <span className={`badge ${statusConfig.bg} ${statusConfig.text} ${statusConfig.darkBg} ${statusConfig.darkText} border ${statusConfig.border} ${statusConfig.darkBorder}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td>
                                                <OrderTypeSpan type={order.order_type} />
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-4">No recent orders found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;