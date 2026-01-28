import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { setPageTitle } from '@/store/themeConfigSlice';
import api from '@/util/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
    const dispatch = useDispatch();
    const [stats, setStats] = useState({
        total_restaurants: 0,
        active_restaurants: 0,
        pending_restaurants: 0,
        total_branches: 0,
        total_users: 0
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Super Admin Dashboard'));

        // Fetch stats from new DashboardController
        api.get('/super-admin/dashboard/stats')
            .then(res => {
                setStats(res.data.stats);
                setRecentActivity(res.data.recent_activity);
            })
            .catch(err => console.error("Error fetching stats:", err))
            .finally(() => setLoading(false));
    }, [dispatch]);

    return (
        <div className="space-y-6">
            {/* Breadcrumbs & Title */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <ul className="flex space-x-2 rtl:space-x-reverse text-sm">
                        <li>
                            <Link to="/" className="text-primary hover:underline">Dashboard</Link>
                        </li>
                        <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-white-dark">
                            <span>SaaS Overview</span>
                        </li>
                    </ul>
                    <h2 className="text-2xl font-bold tracking-tight mt-2">Super Admin Console</h2>
                </div>

                {/* Quick Action Button */}
                <Button asChild>
                    <Link to="/super-admin/onboard-restaurant">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Onboard New Restaurant
                    </Link>
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white-dark">Total Restaurants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '...' : stats.total_restaurants}</div>
                        <p className="text-xs text-muted-foreground mt-1">All registered tenants</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-success">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white-dark">Active Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '...' : stats.active_restaurants}</div>
                        <p className="text-xs text-muted-foreground mt-1">Live restaurants</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-warning">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white-dark">Pending Approvals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '...' : stats.pending_restaurants}</div>
                        <p className="text-xs text-muted-foreground mt-1">Requires verification</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-info">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white-dark">Total Branches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '...' : stats.total_branches}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across all restaurants</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentActivity.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table-hover">
                                <thead>
                                    <tr>
                                        <th>Registered Date</th>
                                        <th>Restaurant Name</th>
                                        <th>Admin</th>
                                        <th>Status</th>
                                        <th className="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentActivity.map((item: any) => (
                                        <tr key={item.id}>
                                            <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                            <td className="font-semibold">{item.name}</td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span>{item.admin_name}</span>
                                                    <span className="text-xs text-white-dark">{item.email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${item.is_active ? 'bg-success' : 'bg-warning'}`}>
                                                    {item.is_active ? 'Active' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <Link to="/super-admin/restaurants" className="text-primary hover:underline">View</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-white-dark mb-4">No recent activity.</p>
                            <Button variant="outline" asChild>
                                <Link to="/super-admin/onboard-restaurant">Onboard First Restaurant</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;