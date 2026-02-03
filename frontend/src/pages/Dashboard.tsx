import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-gray-500 text-sm font-medium">Total Diamonds</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">1,234</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-gray-500 text-sm font-medium">Pending Orders</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">56</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-gray-500 text-sm font-medium">New Leads</h3>
        <p className="text-3xl font-bold text-gray-800 mt-2">12</p>
      </div>
    </div>
  );
};

export default Dashboard;
