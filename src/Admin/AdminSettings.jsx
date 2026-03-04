import React, { useState, useEffect, useContext } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUserCog, faLock, faSave, faEnvelope, faUser,
    faCamera, faShieldAlt, faKey, faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import Swal from 'sweetalert2';

import { ContentBody, PageHeader } from './inc/AdminLayout';
import { requestGet, requestPost } from '../../Services/AxiosService';
import { rootContext } from '../App';

export default function AdminSettings() {
    const rootCtx = useContext(rootContext);

    // ================= STATES =================
    const [profileData, setProfileData] = useState({
        id: 0,
        fullName: "",
        email: "",
        phone: "", // Changed from phoneNumber to match C# AdminMaster model
        status: 1
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [activeTab, setActiveTab] = useState('profile');

    // ================= API ACTIONS =================
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const adminId = localStorage.getItem("adminUserId");
        if (!adminId) return;

        rootCtx.setLoading(true);
        const res = await requestGet(`AdminMaster/getProfile?id=${adminId}`);

        if (res?.status === "OK") {
            setProfileData(res.result);
        }
        rootCtx.setLoading(false);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        rootCtx.setLoading(true);
        // Corrected URL to match your AdminMasterController [HttpPost("changeProfile")]
        const res = await requestPost("AdminMaster/changeProfile", profileData);
        rootCtx.setLoading(false);

        if (res?.status === "OK") {
            Swal.fire("Success", "Profile updated successfully", "success");
            fetchProfile(); // Refresh data
        } else {
            Swal.fire("Error", res?.result || "Update failed", "error");
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return Swal.fire("Error", "New passwords do not match", "error");
        }

        try {
            rootCtx.setLoading(true);
            const adminId = localStorage.getItem("adminUserId");
            
            // Your C# ChangePassword expects (int id, string oldPassword, string newPassword)
            // We pass these as query parameters to match the controller signature
            const url = `AdminMaster/changePassword?id=${adminId}&oldPassword=${passwordData.currentPassword}&newPassword=${passwordData.newPassword}`;
            
            const res = await requestPost(url);
            rootCtx.setLoading(false);

            if (res?.status === "OK") {
                Swal.fire("Success", "Password changed successfully", "success");
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                Swal.fire("Error", res?.result || "Password change failed", "error");
            }
        }
        catch (err) {
            rootCtx.setLoading(false);
            Swal.fire("Error", "Server error. Please try again.", "error");
        }
    };

    return (
        <ContentBody>
            <style>{`
                .loader-container, .spinner-overlay { z-index: 30000 !important; position: fixed !important; }
                .settings-card { border-radius: 20px; border: none; }
                .nav-pills .nav-link.active { background-color: #004d40; }
                .nav-pills .nav-link { color: #555; font-weight: 600; padding: 12px 25px; }
            `}</style>

            <PageHeader>
                <div className="d-flex align-items-center">
                    <div className="bg-success-subtle p-3 rounded-3 me-3">
                        <FontAwesomeIcon icon={faUserCog} className="text-success h4 mb-0" />
                    </div>
                    <div>
                        <h2 className="mb-0" style={{ color: '#004d40' }}>Account Settings</h2>
                        <p className="text-muted mb-0">Manage your profile and security</p>
                    </div>
                </div>
            </PageHeader>

            <div className="row mt-4">
                <div className="col-lg-3 mb-4">
                    <div className="card settings-card shadow-sm p-3">
                        <div className="text-center mb-4 mt-3">
                            <img src="https://cdn-icons-png.flaticon.com/512/9187/9187604.png"
                                 className="rounded-circle shadow-sm border mb-3"
                                 style={{ width: '100px', height: '100px' }} alt="Admin" />
                            <h5 className="fw-bold">{profileData.fullName || "Admin"}</h5>
                            <span className="badge bg-success-subtle text-success rounded-pill">Administrator</span>
                        </div>

                        <div className="nav flex-column nav-pills shadow-none">
                            <button className={`nav-link mb-2 text-start ${activeTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('profile')}>
                                <FontAwesomeIcon icon={faUser} className="me-2" /> Personal Info
                            </button>
                            <button className={`nav-link text-start ${activeTab === 'security' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('security')}>
                                <FontAwesomeIcon icon={faShieldAlt} className="me-2" /> Security
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-lg-9">
                    <div className="card settings-card shadow-sm overflow-hidden">
                        {activeTab === 'profile' ? (
                            <div className="p-4 p-md-5">
                                <h4 className="fw-bold mb-4">Edit Profile</h4>
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="row g-4">
                                        <div className="col-md-12">
                                            <label className="form-label small fw-bold text-muted">FULL NAME</label>
                                            <input type="text" className="form-control bg-light border-0"
                                                value={profileData.fullName || ''}
                                                onChange={e => setProfileData({ ...profileData, fullName: e.target.value })} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-muted">EMAIL</label>
                                            <input type="email" className="form-control bg-light border-0"
                                                value={profileData.email || ''}
                                                onChange={e => setProfileData({ ...profileData, email: e.target.value })} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-muted">PHONE</label>
                                            <input type="text" className="form-control bg-light border-0"
                                                value={profileData.phone || ''}
                                                onChange={e => setProfileData({ ...profileData, phone: e.target.value })} />
                                        </div>
                                        <div className="col-12">
                                            <button type="submit" className="btn text-white px-5 mt-2" style={{ backgroundColor: '#004d40', borderRadius: '10px' }}>
                                                <FontAwesomeIcon icon={faSave} className="me-2" /> Update Profile
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="p-4 p-md-5">
                                <h4 className="fw-bold mb-4">Update Password</h4>
                                <form onSubmit={handlePasswordUpdate}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">CURRENT PASSWORD</label>
                                        <input type="password" className="form-control bg-light border-0"
                                            value={passwordData.currentPassword}
                                            onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
                                    </div>
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-muted">NEW PASSWORD</label>
                                            <input type="password" className="form-control bg-light border-0"
                                                value={passwordData.newPassword}
                                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold text-muted">CONFIRM NEW PASSWORD</label>
                                            <input type="password" className="form-control bg-light border-0"
                                                value={passwordData.confirmPassword}
                                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-dark px-5" style={{ borderRadius: '10px' }}>
                                        <FontAwesomeIcon icon={faKey} className="me-2" /> Change Password
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ContentBody>
    );
}