import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';

const OwnerDashboard = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(setPageTitle('Restaurant Management'));
    }, [dispatch]);

    return (
        <div className="pt-5">
            <div className="mb-6 flex items-center justify-between">
                <h5 className="text-lg font-semibold dark:text-white-light">Restaurant Overview</h5>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {/* Branch Card */}
                <div className="panel bg-gradient-to-r from-blue-500 to-blue-400 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">Total Branches</div>
                    </div>
                    <div className="mt-5 flex items-center">
                        <div className="text-3xl font-bold">--</div>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="panel bg-gradient-to-r from-purple-500 to-purple-400 text-white">
                    <div className="flex justify-between">
                        <div className="text-md font-semibold">Today's Orders</div>
                    </div>
                    <div className="mt-5 flex items-center">
                        <div className="text-3xl font-bold">0</div>
                    </div>
                </div>
            </div>

            <div className="panel mt-6">
                <h5 className="mb-5 text-lg font-semibold dark:text-white-light">Recent Activity</h5>
                <p className="text-white-dark">Welcome! Start by managing your menu or checking your QR tables.</p>
            </div>
        </div>
    );
};

export default OwnerDashboard;