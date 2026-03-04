import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faPlus, faEdit, faTrash, faBook, faCode, 
    faLayerGroup, faSearch, faSyncAlt, faCertificate, faTimes 
} from "@fortawesome/free-solid-svg-icons";
import { Modal, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';

import { ContentBody, PageHeader } from './inc/AdminLayout';
import { requestGet, requestPost } from '../../Services/AxiosService';
import { rootContext } from '../App';

export default function Subjects() {
    const rootCtx = useContext(rootContext);

    // ================= STATES =================
    const [subjects, setSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    
    // Filter States
    const [filterSem, setFilterSem] = useState("All");

    // ================= DYNAMIC DROPDOWN DATA =================
    const uniqueSemesters = useMemo(() => {
        const sems = subjects.map(s => s.semester).filter(Boolean);
        return [...new Set(sems)].sort();
    }, [subjects]);

    // ================= FORMIK CONFIGURATION =================
    const formik = useFormik({
        initialValues: { 
            id: 0, 
            subjectName: '', 
            subjectCode: '', 
            semester: '', 
            credits: 0
        },
        validationSchema: Yup.object({
            subjectName: Yup.string().required("Required"),
            subjectCode: Yup.string().required("Required"),
            semester: Yup.string().required("Required"),
            credits: Yup.number().min(1, "Minimum 1 credit").required("Required"),
        }),
        onSubmit: async (values) => {
            const endpoint = editMode ? "Subject/update" : "Subject/add";
            rootCtx.setLoading(true);
            const res = await requestPost(endpoint, values);
            rootCtx.setLoading(false);
            
            if (res?.status === "OK") {
                Swal.fire({ icon: 'success', title: 'Saved', text: res.result, confirmButtonColor: '#004d40' });
                setShowModal(false);
                fetchSubjects();
            } else {
                Swal.fire("Error", res?.result || "Operation failed", "error");
            }
        }
    });

    // ================= API ACTIONS =================
    const fetchSubjects = async () => {
        rootCtx.setLoading(true);
        const res = await requestGet("Subject/list");
        if (res?.status === "OK") setSubjects(res.result);
        rootCtx.setLoading(false);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will remove the subject from the curriculum!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            // Note: You might need a Delete endpoint in your C# controller
            // For now, this is a placeholder for your future delete logic
            Swal.fire("Notice", "Delete API endpoint needed in Controller", "info");
        }
    };

    // ================= FILTER LOGIC =================
    const filteredSubjects = useMemo(() => {
        return subjects.filter(s => {
            const matchesSearch = 
                s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesSem = filterSem === "All" || s.semester === filterSem;

            return matchesSearch && matchesSem;
        });
    }, [subjects, searchTerm, filterSem]);

    useEffect(() => { fetchSubjects(); }, []);

    return (
        <ContentBody>
            <PageHeader>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <span className="text-muted small fw-bold text-uppercase">Curriculum Management</span>
                        <h2 className="mb-0" style={{ color: '#004d40' }}>Course Subjects</h2>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-light border shadow-sm" onClick={fetchSubjects}>
                            <FontAwesomeIcon icon={faSyncAlt} />
                        </button>
                        <button className="btn text-white px-4 shadow-sm" style={{ backgroundColor: '#004d40', borderRadius: '10px' }} 
                            onClick={() => { setEditMode(false); formik.resetForm(); setShowModal(true); }}>
                            <FontAwesomeIcon icon={faPlus} className="me-2" /> Add Subject
                        </button>
                    </div>
                </div>
            </PageHeader>

            {/* ================= FILTER TOOLBAR ================= */}
            <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: '15px' }}>
                <div className="row g-3 align-items-center">
                    <div className="col-md-5">
                        <div className="input-group bg-light rounded-pill px-3 py-1 border">
                            <span className="input-group-text border-0 bg-transparent text-muted">
                                <FontAwesomeIcon icon={faSearch} />
                            </span>
                            <input 
                                type="text" 
                                className="form-control border-0 bg-transparent shadow-none" 
                                placeholder="Search by name or code..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <div className="col-md-3">
                        <select className="form-select rounded-pill border-light bg-light shadow-none" 
                            value={filterSem} onChange={(e) => setFilterSem(e.target.value)}>
                            <option value="All">All Semesters</option>
                            {uniqueSemesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
                        </select>
                    </div>

                    <div className="col-md-4 text-end">
                        <button className="btn btn-sm text-danger fw-bold me-3" onClick={() => {setSearchTerm(""); setFilterSem("All");}}>
                            <FontAwesomeIcon icon={faTimes} /> Reset
                        </button>
                        <span className="badge bg-dark px-3 py-2 rounded-pill">
                            {filteredSubjects.length} Total Subjects
                        </span>
                    </div>
                </div>
            </div>

            {/* ================= DATA TABLE ================= */}
            <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '15px' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr className="text-uppercase small fw-bold text-muted">
                                <th className="ps-4 py-3 border-0">Subject Detail</th>
                                <th className="py-3 border-0">Code</th>
                                <th className="py-3 border-0">Semester</th>
                                <th className="py-3 border-0 text-center">Credits</th>
                                <th className="text-end pe-4 py-3 border-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubjects.length > 0 ? filteredSubjects.map(s => (
                                <tr key={s.id}>
                                    <td className="ps-4 py-3">
                                        <div className="d-flex align-items-center">
                                            <div className="avatar me-3 text-white d-flex align-items-center justify-content-center shadow-sm" 
                                                 style={{ width: '45px', height: '45px', borderRadius: '12px', backgroundColor: '#2e7d32' }}>
                                                <FontAwesomeIcon icon={faBook} />
                                            </div>
                                            <div>
                                                <div className="fw-bold text-dark">{s.subjectName}</div>
                                                <div className="text-muted small">Added on: {new Date(s.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge bg-info-subtle text-info border border-info-subtle px-3"><FontAwesomeIcon icon={faCode} className="me-1"/> {s.subjectCode}</span></td>
                                    <td><span className="fw-bold text-secondary"><FontAwesomeIcon icon={faLayerGroup} className="me-1"/> {s.semester}</span></td>
                                    <td className="text-center">
                                        <div className="d-inline-flex align-items-center justify-content-center bg-light border rounded-circle fw-bold" style={{width:'35px', height:'35px', color:'#004d40'}}>
                                            {s.credits}
                                        </div>
                                    </td>
                                    <td className="text-end pe-4">
                                        <button className="btn btn-sm btn-light text-primary me-2 border shadow-sm" onClick={() => {
                                            setEditMode(true);
                                            formik.setValues(s);
                                            setShowModal(true);
                                        }}>
                                            <FontAwesomeIcon icon={faEdit}/>
                                        </button>
                                        <button className="btn btn-sm btn-light text-danger border shadow-sm" onClick={() => handleDelete(s.id)}>
                                            <FontAwesomeIcon icon={faTrash}/>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="text-center py-5 text-muted">No subjects found in the records.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= MODAL ================= */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                <form onSubmit={formik.handleSubmit}>
                    <Modal.Header closeButton className="border-0">
                        <Modal.Title className="fw-bold" style={{ color: '#004d40' }}>
                            {editMode ? 'Edit Subject' : 'Add New Subject'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label small fw-bold">Subject Name</label>
                                <input name="subjectName" className={`form-control ${formik.touched.subjectName && formik.errors.subjectName ? 'is-invalid' : ''}`} {...formik.getFieldProps('subjectName')} placeholder="e.g. Data Structures" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">Subject Code</label>
                                <input name="subjectCode" className={`form-control ${formik.touched.subjectCode && formik.errors.subjectCode ? 'is-invalid' : ''}`} {...formik.getFieldProps('subjectCode')} placeholder="e.g. CS101" />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold">Credits</label>
                                <input type="number" name="credits" className={`form-control ${formik.touched.credits && formik.errors.credits ? 'is-invalid' : ''}`} {...formik.getFieldProps('credits')} />
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-bold">Semester</label>
                                <select name="semester" className={`form-select ${formik.touched.semester && formik.errors.semester ? 'is-invalid' : ''}`} {...formik.getFieldProps('semester')}>
                                    <option value="">Select Semester</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => <option key={num} value={`Sem ${num}`}>Semester {num}</option>)}
                                </select>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="border-0">
                        <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" style={{ backgroundColor: '#004d40', border: 'none', padding: '10px 30px' }}>
                            {editMode ? 'Update Subject' : 'Save Subject'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </ContentBody>
    );
}