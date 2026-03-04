import React from 'react';
import { ContentBody, PageHeader } from './inc/AdminLayout';

export default function Dashboard() {
    return (
        <ContentBody>
            <PageHeader>
                <span>Home / Dashboard</span>
                <h2>Welcome back, John! 👋</h2>
            </PageHeader>

            <div className="row g-4">
                {/* Stat Cards */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4 text-white" style={{ background: '#004d40', borderRadius: '15px' }}>
                        <h6 className="opacity-75">Total Courses</h6>
                        <h3>12</h3>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
                        <h6 className="text-muted">Attendance</h6>
                        <h3 style={{ color: '#2ecc71' }}>92%</h3>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
                        <h6 className="text-muted">Assignments</h6>
                        <h3 style={{ color: '#004d40' }}>04</h3>
                    </div>
                </div>

                {/* Main Overview Section */}
                <div className="col-12">
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '15px' }}>
                        <h5 className="mb-3" style={{ color: '#004d40', fontWeight: 'bold' }}>Overview</h5>
                        <p className="text-muted">Select a menu item from the sidebar to view your specific virtual class content.</p>
                        <div className="mt-4 p-5 bg-light text-center rounded-3">
                            <p className="m-0 text-muted italic">Analytics data will appear here once you start your lessons.</p>
                        </div>
                    </div>
                </div>
            </div>
        </ContentBody>
    );
}