import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { setPageTitle } from '@/store/themeConfigSlice';
import api from '@/util/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
    const dispatch = useDispatch();
    const [stats, setStats] = useState({ restaurants: 0, branches: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Super Admin Dashboard'));
        
        // Fetch stats from your Laravel TenantController index method
        api.get('/super-admin/restaurants')
            .then(res => {
                const totalBranches = res.data.reduce((acc: number, curr: any) => acc + curr.branches_count, 0);
                setStats({
                    restaurants: res.data.length,
                    branches: totalBranches
                });
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
                <Card className="border-l-4 border-l-danger">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white-dark">Total Restaurants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '...' : stats.restaurants}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active subscriptions</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-info">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white-dark">Total Branches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{loading ? '...' : stats.branches}</div>
                        <p className="text-xs text-muted-foreground mt-1">Live locations</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.restaurants === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-white-dark mb-4">No restaurants have been onboarded yet.</p>
                            <Button variant="outline" asChild>
                                <Link to="/super-admin/onboard-restaurant">Get Started</Link>
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-white-dark italic">Recent logs and restaurant performance metrics will appear here.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;