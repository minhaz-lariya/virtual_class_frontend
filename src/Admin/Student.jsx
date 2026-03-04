import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faPlus, faEdit, faTrash, faEnvelope, faPhone, 
    faUserGraduate, faSearch, faCircle, faSyncAlt, faIdCard, faKey, faTimes 
} from "@fortawesome/free-solid-svg-icons";
import { Modal, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';

import { ContentBody, PageHeader } from './inc/AdminLayout';
import { requestGet, requestPost } from '../../Services/AxiosService';
import { rootContext } from '../App';

export default function Students() {
    const rootCtx = useContext(rootContext);

    // ================= STATES =================
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    // Filter States
    const [filterClass, setFilterClass] = useState("All");
    const [filterSem, setFilterSem] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");

    // ================= DYNAMIC DROPDOWN DATA =================
    // Extracts unique values from the students list automatically
    const uniqueClasses = useMemo(() => {
        const classes = students.map(s => s.className).filter(Boolean);
        return [...new Set(classes)].sort();
    }, [students]);

    const uniqueSemesters = useMemo(() => {
        const sems = students.map(s => s.semester).filter(Boolean);
        return [...new Set(sems)].sort((a, b) => a - b);
    }, [students]);

    // ================= FORMIK CONFIGURATION =================
    const formik = useFormik({
        initialValues: { 
            id: 0, 
            fullName: '', 
            email: '', 
            phone: '', 
            enrollmentNo: '', 
            className: '', 
            division: '', 
            semester: '', 
            status: 'Active' 
        },
        validationSchema: Yup.object({
            fullName: Yup.string().required("Required"),
            email: Yup.string().email("Invalid email").required("Required"),
            enrollmentNo: Yup.string().required("Required"),
            className: Yup.string().required("Required"),
            division: Yup.string().required("Required"),
            semester: Yup.string().required("Required"),
            phone: Yup.string().min(10, "Minimum 10 digits").required("Required"),
        }),
        onSubmit: async (values) => {
            const endpoint = editMode ? "Student/changeProfile" : "Student/signup";
            rootCtx.setLoading(true);
            const res = await requestPost(endpoint, values);
            rootCtx.setLoading(false);
            
            if (res?.status === "OK") {
                Swal.fire({ 
                    icon: 'success', 
                    title: editMode ? 'Profile Updated' : 'Student Registered', 
                    text: res.result, 
                    confirmButtonColor: '#004d40' 
                });
                setShowModal(false);
                fetchStudents();
            } else {
                Swal.fire("Error", res?.result || "Operation failed", "error");
            }
        }
    });

    // ================= API ACTIONS =================
    const fetchStudents = async () => {
        rootCtx.setLoading(true);
        const res = await requestGet("Student/list");
        if (res?.status === "OK") setStudents(res.result);
        rootCtx.setLoading(false);
    };

    const toggleStatus = async (student) => {
        const newStatus = student.status === "Active" ? "Inactive" : "Active";
        const result = await Swal.fire({
            title: 'Change Status?',
            text: `Set ${student.fullName} to ${newStatus}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#004d40',
            cancelButtonColor: '#d33',
        });

        if (result.isConfirmed) {
            rootCtx.setLoading(true);
            const res = await requestPost("Student/changeProfile", { ...student, status: newStatus });
            rootCtx.setLoading(false);
            if (res?.status === "OK") {
                fetchStudents();
                Swal.fire("Updated!", `Student is now ${newStatus}`, "success");
            }
        }
    };

    const handleForgotPassword = async (email) => {
        const result = await Swal.fire({
            title: 'Reset Password?',
            text: `Generate a new password for ${email}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#004d40',
        });

        if (result.isConfirmed) {
            rootCtx.setLoading(true);
            const res = await requestPost(`Student/forgotPassword?email=${email}`);
            rootCtx.setLoading(false);

            if (res?.status === "OK") {
                Swal.fire({
                    title: 'New Password Generated',
                    html: `Password: <strong style="font-size: 1.5rem; color: #004d40;">${res.result}</strong>`,
                    icon: 'success'
                });
            }
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setFilterClass("All");
        setFilterSem("All");
        setFilterStatus("All");
    };

    // ================= FILTER LOGIC =================
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = 
                s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesClass = filterClass === "All" || s.className === filterClass;
            const matchesSem = filterSem === "All" || s.semester.toString() === filterSem;
            const matchesStatus = filterStatus === "All" || s.status === filterStatus;

            return matchesSearch && matchesClass && matchesSem && matchesStatus;
        });
    }, [students, searchTerm, filterClass, filterSem, filterStatus]);

    const openEdit = (item) => {
        setEditMode(true);
        formik.setValues(item);
        setShowModal(true);
    };

    useEffect(() => { fetchStudents(); }, []);

    return (
        <ContentBody>
            <PageHeader>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <span className="text-muted small fw-bold text-uppercase">Academic Management</span>
                        <h2 className="mb-0" style={{ color: '#004d40' }}>Students Directory</h2>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light border shadow-sm" onClick={fetchStudents} title="Refresh Data">
                            <FontAwesomeIcon icon={faSyncAlt} />
                        </button>
                        <button className="btn text-white px-4 shadow-sm" style={{ backgroundColor: '#004d40', borderRadius: '10px' }} 
                            onClick={() => { setEditMode(false); formik.resetForm(); setShowModal(true); }}>
                            <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Student
                        </button>
                    </div>
                </div>
            </PageHeader>

            {/* ================= FILTER TOOLBAR ================= */}
            <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: '15px' }}>
                <div className="row g-3 align-items-center">
                    {/* Search */}
                    <div className="col-md-3">
                        <div className="input-group bg-light rounded-pill px-3 py-1 border">
                            <span className="input-group-text border-0 bg-transparent text-muted">
                                <FontAwesomeIcon icon={faSearch} />
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-0 bg-transparent shadow-none" 
                                placeholder="Search students..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {/* Dynamic Class Filter */}
                    <div className="col-md-2">
                        <select className="form-select rounded-pill border-light bg-light shadow-none" 
                            value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                            <option value="All">All Classes</option>
                            {uniqueClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                    </div>

                    {/* Dynamic Semester Filter */}
                    <div className="col-md-2">
                        <select className="form-select rounded-pill border-light bg-light shadow-none" 
                            value={filterSem} onChange={(e) => setFilterSem(e.target.value)}>
                            <option value="All">All Semesters</option>
                            {uniqueSemesters.map(n => <option key={n} value={n}>Sem {n}</option>)}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="col-md-2">
                        <select className="form-select rounded-pill border-light bg-light shadow-none" 
                            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Reset & Count */}
                    <div className="col-md-3 text-end d-flex align-items-center justify-content-end gap-3">
                        <button className="btn btn-sm text-danger fw-bold" onClick={resetFilters}>
                            <FontAwesomeIcon icon={faTimes} className="me-1" /> Reset
                        </button>
                        <div className="px-3 py-1 bg-dark text-white rounded-pill small fw-bold">
                            {filteredStudents.length} Students
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= DATA TABLE ================= */}
            <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '15px' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr className="text-uppercase small fw-bold text-muted">
                                <th className="ps-4 py-3 border-0">Student Profile</th>
                                <th className="py-3 border-0">Academic Info</th>
                                <th className="py-3 border-0 text-center">Status</th>
                                <th className="text-end pe-4 py-3 border-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? filteredStudents.map(s => (
                                <tr key={s.id}>
                                    <td className="ps-4 py-3">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar me-3 text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" 
                                                 style={{ width: '50px', height: '50px', borderRadius: '14px', backgroundColor: '#00695c' }}>
                                                {s.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{s.fullName}</div>
                                                <div className="text-muted small">
                                                    <div><FontAwesomeIcon icon={faIdCard} className="me-1" /> {s.enrollmentNo}</div>
                                                    <div className="text-primary"><FontAwesomeIcon icon={faEnvelope} className="me-1" /> {s.email}</div>
                                                    <div className="text-success"><FontAwesomeIcon icon={faPhone} className="me-1" /> {s.phone}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="fw-bold text-dark">{s.className} ({s.division})</div>
                                        <div className="badge bg-light text-dark border mt-1 px-2">Semester {s.semester}</div>
                                    </td>
                                    <td className="text-center">
                                        <span 
                                            onClick={() => toggleStatus(s)}
                                            className={`badge rounded-pill px-3 py-2 border cursor-pointer ${s.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}
                                            style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                                        >
                                            <FontAwesomeIcon icon={faCircle} className="me-1" style={{ fontSize: '6px' }} /> {s.status}
                                        </span>
                                    </td>
                                    <td className="text-end pe-4">
                                        <button className="btn btn-sm btn-light text-warning me-2 border shadow-sm" title="Reset Password" onClick={() => handleForgotPassword(s.email)}>
                                            <FontAwesomeIcon icon={faKey}/>
                                        </button>
                                        <button className="btn btn-sm btn-light text-primary me-2 border shadow-sm" title="Edit Profile" onClick={() => openEdit(s)}>
                                            <FontAwesomeIcon icon={faEdit}/>
                                        </button>
                                        <button className="btn btn-sm btn-light text-danger border shadow-sm" title="Delete Student">
                                            <FontAwesomeIcon icon={faTrash}/>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="text-center py-5 text-muted">No records match your criteria.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= ADD/EDIT MODAL ================= */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered backdrop="static">
                <form onSubmit={formik.handleSubmit}>
                    <Modal.Header closeButton className="border-0">
                        <Modal.Title className="fw-bold" style={{ color: '#004d40' }}>
                            {editMode ? 'Update Student Profile' : 'New Student Registration'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="pt-0">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">Full Name</label>
                                <input name="fullName" className={`form-control ${formik.touched.fullName && formik.errors.fullName ? 'is-invalid' : ''}`} {...formik.getFieldProps('fullName')} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">Enrollment Number</label>
                                <input name="enrollmentNo" className={`form-control ${formik.touched.enrollmentNo && formik.errors.enrollmentNo ? 'is-invalid' : ''}`} {...formik.getFieldProps('enrollmentNo')} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">Email Address</label>
                                <input name="email" className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`} {...formik.getFieldProps('email')} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">Phone Number</label>
                                <input name="phone" className={`form-control ${formik.touched.phone && formik.errors.phone ? 'is-invalid' : ''}`} {...formik.getFieldProps('phone')} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small fw-bold">Class Name</label>
                                <input name="className" placeholder="e.g. BCA" className={`form-control ${formik.touched.className && formik.errors.className ? 'is-invalid' : ''}`} {...formik.getFieldProps('className')} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small fw-bold">Division</label>
                                <input name="division" placeholder="A" className={`form-control ${formik.touched.division && formik.errors.division ? 'is-invalid' : ''}`} {...formik.getFieldProps('division')} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small fw-bold">Semester</label>
                                <select name="semester" className="form-select" {...formik.getFieldProps('semester')}>
                                    <option value="">Select</option>
                                    {[1,2,3,4,5,6,7,8].map(num => <option key={num} value={num}>Semester {num}</option>)}
                                </select>
                            </div>
                        </div>

                        {editMode && (
                            <div className="mt-4 p-3 bg-light rounded border">
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
                        <Button type="submit" style={{ backgroundColor: '#004d40', border: 'none', padding: '10px 40px', borderRadius: '8px' }}>
                            {editMode ? 'Save Changes' : 'Register Student'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </ContentBody>
    );
}