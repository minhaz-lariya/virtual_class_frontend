import React, { useState, useEffect, useContext } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faPlus, faEdit, faTrash, faEnvelope, faPhone, 
    faBuilding, faSearch, faCircle, faSyncAlt 
} from "@fortawesome/free-solid-svg-icons";
import { Modal, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';

import { ContentBody, PageHeader } from './inc/AdminLayout';
import { requestGet, requestPost } from './../../Services/AxiosService';
import { rootContext } from '../App';

export default function Faculties() {
    const rootCtx = useContext(rootContext);

    // States
    const [faculties, setFaculties] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);

    // --- 1. Formik & Yup Validation ---
    const formik = useFormik({
        initialValues: { 
            id: 0, 
            fullName: '', 
            email: '', 
            phone: '', 
            department: '', 
            status: 'Active' 
        },
        validationSchema: Yup.object({
            fullName: Yup.string().min(3, "Too short").required("Full Name is required"),
            email: Yup.string().email("Invalid email").required("Email is required"),
            phone: Yup.string().matches(/^[0-9]+$/, "Digits only").min(10, "Min 10 digits").required("Phone is required"),
            department: Yup.string().required("Department is required"),
            status: Yup.string().required()
        }),
        onSubmit: async (values) => {
            const endpoint = editMode ? "Faculty/changeProfile" : "Faculty/signup";
            rootCtx.setLoading(true);
            const res = await requestPost(endpoint, values);
            rootCtx.setLoading(false);
            
            if (res?.status === "OK") {
                Swal.fire({ icon: 'success', title: 'Saved!', text: res.result, confirmButtonColor: '#004d40' });
                setShowModal(false);
                fetchFaculties();
            }
        }
    });

    // --- 2. API Operations ---
    const fetchFaculties = async () => {
        rootCtx.setLoading(true);
        const res = await requestGet("Faculty/list");
        if (res?.status === "OK") setFaculties(res.result);
        rootCtx.setLoading(false);
    };

    const toggleStatus = async (faculty) => {
        const newStatus = faculty.status === "Active" ? "Inactive" : "Active";
        
        const result = await Swal.fire({
            title: 'Change Status?',
            text: `Set ${faculty.fullName} to ${newStatus}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#004d40',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, change it!'
        });

        if (result.isConfirmed) {
            rootCtx.setLoading(true);
            const res = await requestPost("Faculty/changeProfile", { ...faculty, status: newStatus });
            rootCtx.setLoading(false);
            if (res?.status === "OK") {
                Swal.fire("Updated!", `Faculty status is now ${newStatus}.`, "success");
                fetchFaculties();
            }
        }
    };

    // --- 3. Filter Logic ---
    const filteredFaculties = faculties.filter(f => 
        f.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openEdit = (item) => {
        setEditMode(true);
        formik.setValues(item);
        setShowModal(true);
    };

    useEffect(() => { fetchFaculties(); }, []);

    return (
        <ContentBody>
            <PageHeader>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <span>Management</span>
                        <h2>Faculties</h2>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light border shadow-sm" onClick={fetchFaculties}>
                            <FontAwesomeIcon icon={faSyncAlt} />
                        </button>
                        <button className="btn text-white px-4 shadow-sm" style={{ backgroundColor: '#004d40', borderRadius: '10px' }} 
                            onClick={() => { setEditMode(false); formik.resetForm(); setShowModal(true); }}>
                            <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Faculty
                        </button>
                    </div>
                </div>
            </PageHeader>

            {/* Search Bar */}
            <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: '15px' }}>
                <div className="row align-items-center">
                    <div className="col-md-5">
                        <div className="input-group bg-light rounded-pill px-3 py-1 border">
                            <span className="input-group-text border-0 bg-transparent text-muted">
                                <FontAwesomeIcon icon={faSearch} />
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-0 bg-transparent shadow-none" 
                                placeholder="Search by name, email or department..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '15px' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th className="ps-4 py-3 border-0">Faculty Info</th>
                                <th className="py-3 border-0">Department</th>
                                <th className="py-3 border-0 text-center">Status</th>
                                <th className="text-end pe-4 py-3 border-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFaculties.length > 0 ? filteredFaculties.map(f => (
                                <tr key={f.id}>
                                    <td className="ps-4 py-3">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar me-3 text-white d-flex align-items-center justify-content-center fw-bold" 
                                                 style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#004d40' }}>
                                                {f.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark">{f.fullName}</div>
                                                <div className="text-muted small">
                                                    <FontAwesomeIcon icon={faEnvelope} className="me-1" /> {f.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge bg-light text-dark border px-3">
                                            <FontAwesomeIcon icon={faBuilding} className="me-1 text-muted" /> {f.department}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span 
                                            onClick={() => toggleStatus(f)}
                                            className={`badge rounded-pill px-3 py-2 border cursor-pointer ${f.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                                            style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                                        >
                                            <FontAwesomeIcon icon={faCircle} className="me-1" style={{ fontSize: '6px' }} /> {f.status}
                                        </span>
                                    </td>
                                    <td className="text-end pe-4">
                                        <button className="btn btn-sm btn-light text-primary me-2 border shadow-sm" onClick={() => openEdit(f)}>
                                            <FontAwesomeIcon icon={faEdit}/>
                                        </button>
                                        <button className="btn btn-sm btn-light text-danger border shadow-sm">
                                            <FontAwesomeIcon icon={faTrash}/>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="text-center py-5 text-muted">No records found matching your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Add/Edit Modal --- */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                <form onSubmit={formik.handleSubmit}>
                    <Modal.Header closeButton className="border-0">
                        <Modal.Title className="fw-bold" style={{ color: '#004d40' }}>
                            {editMode ? 'Update Faculty' : 'Register New Faculty'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="pt-0">
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Full Name</label>
                            <input name="fullName" className={`form-control ${formik.touched.fullName && formik.errors.fullName ? 'is-invalid' : ''}`} {...formik.getFieldProps('fullName')} />
                            <div className="invalid-feedback">{formik.errors.fullName}</div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">Email Address</label>
                            <input name="email" className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`} {...formik.getFieldProps('email')} />
                            <div className="invalid-feedback">{formik.errors.email}</div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label small fw-bold">Phone</label>
                                <input name="phone" className={`form-control ${formik.touched.phone && formik.errors.phone ? 'is-invalid' : ''}`} {...formik.getFieldProps('phone')} />
                                <div className="invalid-feedback">{formik.errors.phone}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label small fw-bold">Department</label>
                                <select name="department" className={`form-select ${formik.touched.department && formik.errors.department ? 'is-invalid' : ''}`} {...formik.getFieldProps('department')}>
                                    <option value="">Select...</option>
                                    <option value="BCA">BCA</option>
                                    <option value="MCA">MCA</option>
                                    <option value="BSC-IT">B.Sc IT</option>
                                </select>
                                <div className="invalid-feedback">{formik.errors.department}</div>
                            </div>
                        </div>
                        {editMode && (
                            <div className="mb-3">
                                <label className="form-label small fw-bold">Account Status</label>
                                <select name="status" className="form-select" {...formik.getFieldProps('status')}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" style={{ backgroundColor: '#004d40', border: 'none', padding: '10px 25px' }}>
                            {editMode ? 'Save Changes' : 'Create Account'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </ContentBody>
    );
}