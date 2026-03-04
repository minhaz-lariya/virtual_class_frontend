import React, { useState, useEffect, useContext, useMemo } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faUserTie, faBookOpen, faPlus, faTrash, faCheckCircle, 
    faSearch, faSyncAlt, faArrowRight, faUnlink, faLayerGroup 
} from "@fortawesome/free-solid-svg-icons";
import { Modal, Button } from 'react-bootstrap';
import Swal from 'sweetalert2';

import { ContentBody, PageHeader } from './inc/AdminLayout';
import { requestGet, requestPost } from '../../Services/AxiosService';
import { rootContext } from '../App';

export default function FacultyAllocation() {
    const rootCtx = useContext(rootContext);

    // ================= ALL STATES =================
    const [allocations, setAllocations] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [subjects, setSubjects] = useState([]);
    
    // UI Logic States
    const [showModal, setShowModal] = useState(false);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal Specific Filter States
    const [subSearch, setSubSearch] = useState("");
    const [modalFilterSem, setModalFilterSem] = useState("All");

    // ================= DYNAMIC DATA =================
    const uniqueSemesters = useMemo(() => {
        const sems = subjects.map(s => s.semester).filter(Boolean);
        return [...new Set(sems)].sort();
    }, [subjects]);

    // ================= API ACTIONS =================
    const fetchAllData = async () => {
        rootCtx.setLoading(true);
        try {
            const [resAlloc, resFac, resSub] = await Promise.all([
                requestGet("FacultySubject/list"),
                requestGet("Faculty/list"),
                requestGet("Subject/list")
            ]);

            if (resAlloc?.status === "OK") setAllocations(resAlloc.result);
            if (resFac?.status === "OK") setFaculties(resFac.result);
            if (resSub?.status === "OK") setSubjects(resSub.result);
        } catch (error) { 
            console.error("API Error:", error); 
        }
        rootCtx.setLoading(false);
    };

    const handleBulkAssign = async () => {
        if (!selectedFaculty || selectedSubjectIds.length === 0) return;

        rootCtx.setLoading(true);
        const payload = {
            facultyId: selectedFaculty.id,
            subjectIds: selectedSubjectIds
        };

        const res = await requestPost("FacultySubject/bulkAssign", payload);
        rootCtx.setLoading(false);

        if (res?.status === "OK") {
            Swal.fire({ icon: 'success', title: 'Workload Allocated', confirmButtonColor: '#004d40' });
            setShowModal(false);
            resetForm();
            fetchAllData();
        }
    };

    const handleRemove = async (id) => {
        const result = await Swal.fire({
            title: 'Remove Allocation?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
        });

        if (result.isConfirmed) {
            rootCtx.setLoading(true);
            const res = await requestPost(`FacultySubject/remove?fsId=${id}`);
            rootCtx.setLoading(false);
            if (res?.status === "OK") fetchAllData();
        }
    };

    const resetForm = () => {
        setSelectedFaculty(null);
        setSelectedSubjectIds([]);
        setSubSearch("");
        setModalFilterSem("All");
    };

    const toggleSubject = (id) => {
        setSelectedSubjectIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    // ================= FILTER LOGIC =================
    const filteredAllocations = useMemo(() => {
        return allocations.filter(a => 
            a.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allocations, searchTerm]);

    const filteredSubjectsInModal = useMemo(() => {
        return subjects.filter(s => {
            const matchesSearch = s.subjectName.toLowerCase().includes(subSearch.toLowerCase()) ||
                                s.subjectCode.toLowerCase().includes(subSearch.toLowerCase());
            const matchesSem = modalFilterSem === "All" || s.semester === modalFilterSem;
            return matchesSearch && matchesSem;
        });
    }, [subjects, subSearch, modalFilterSem]);

    useEffect(() => { fetchAllData(); }, []);

    return (
        <ContentBody>
            {/* GLOBAL CSS INJECTION:
                Ensures Sidebar < Backdrop < Modal < Loader
            */}
            <style>{`
                .sidebar { z-index: 1000 !important; }
                .modal-backdrop { z-index: 10000 !important; }
                .modal { z-index: 10001 !important; }
                
                /* Target your "Please Wait" loader here */
                /* Replace .loader-container with your actual loader class if different */
                .loader-container, .spinner-overlay, #loading-screen { 
                    z-index: 20000 !important; 
                    position: fixed !important;
                    top: 0; left: 0; width: 100%; height: 100%;
                }
            `}</style>

            <PageHeader>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <span className="text-muted small fw-bold">ACADEMIC TOOLS</span>
                        <h2 className="mb-0" style={{ color: '#004d40' }}>Workload Allocation</h2>
                    </div>
                    <button className="btn text-white px-4 shadow-sm" style={{ backgroundColor: '#004d40', borderRadius: '10px' }} 
                        onClick={() => { resetForm(); setShowModal(true); }}>
                        <FontAwesomeIcon icon={faPlus} className="me-2" /> Assign Workload
                    </button>
                </div>
            </PageHeader>

            {/* Main Search Bar */}
            <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: '15px' }}>
                <div className="input-group bg-light rounded-pill px-3 py-1 border">
                    <span className="input-group-text border-0 bg-transparent text-muted"><FontAwesomeIcon icon={faSearch} /></span>
                    <input type="text" className="form-control border-0 bg-transparent shadow-none" placeholder="Search by faculty or subject..." 
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Allocation Table */}
            <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '15px' }}>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr className="small text-uppercase text-muted fw-bold">
                                <th className="ps-4 py-3 border-0">Faculty</th>
                                <th className="py-3 border-0">Assigned Subject</th>
                                <th className="text-end pe-4 py-3 border-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAllocations.map(a => (
                                <tr key={a.id}>
                                    <td className="ps-4 py-3 fw-bold text-dark">{a.facultyName}</td>
                                    <td>
                                        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                                            <FontAwesomeIcon icon={faBookOpen} className="me-2" /> {a.subjectName}
                                        </span>
                                    </td>
                                    <td className="text-end pe-4">
                                        <button className="btn btn-sm text-danger border-0" onClick={() => handleRemove(a.id)}>
                                            <FontAwesomeIcon icon={faUnlink} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= BULK ALLOCATION MODAL ================= */}
            <Modal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                size="xl" 
                centered 
                scrollable 
                backdrop="static"
                container={document.body} 
            >
                <Modal.Header closeButton className="border-0 bg-white">
                    <Modal.Title className="fw-bold" style={{color:'#004d40'}}>
                        <FontAwesomeIcon icon={faLayerGroup} className="me-2"/> Bulk Workload Builder
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-4">
                    <div className="row g-4">
                        {/* 1. Faculty Select (Left) */}
                        <div className="col-md-4">
                            <div className="card border-0 shadow-sm h-100 p-3" style={{borderRadius:'15px'}}>
                                <label className="form-label fw-bold text-muted small text-uppercase mb-3">1. Select Faculty</label>
                                <div className="list-group" style={{maxHeight:'400px', overflowY:'auto'}}>
                                    {faculties.map(f => (
                                        <button 
                                            key={f.id} 
                                            onClick={() => setSelectedFaculty(f)}
                                            className={`list-group-item list-group-item-action border-0 rounded-3 mb-2 p-3 ${selectedFaculty?.id === f.id ? 'bg-success text-white shadow' : 'bg-white shadow-sm'}`}
                                        >
                                            <FontAwesomeIcon icon={faUserTie} className="me-2"/> {f.fullName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Subject Multi-Select (Right) */}
                        <div className="col-md-8">
                            <div className="card border-0 shadow-sm h-100 p-3" style={{borderRadius:'15px'}}>
                                <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
                                    <label className="form-label fw-bold text-muted small text-uppercase mb-0">2. Select Subjects</label>
                                    
                                    <div className="d-flex gap-2 w-75">
                                        {/* Semester Filter */}
                                        <select className="form-select form-select-sm rounded-pill w-auto shadow-none border-success" 
                                            value={modalFilterSem} onChange={e => setModalFilterSem(e.target.value)}>
                                            <option value="All">All Semesters</option>
                                            {uniqueSemesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
                                        </select>

                                        {/* Subject Search */}
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-white border-end-0"><FontAwesomeIcon icon={faSearch} className="text-muted"/></span>
                                            <input type="text" className="form-control border-start-0 ps-0 shadow-none" placeholder="Filter..." 
                                                onChange={e => setSubSearch(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="row g-2" style={{maxHeight:'400px', overflowY:'auto'}}>
                                    {filteredSubjectsInModal.map(s => (
                                        <div className="col-md-6" key={s.id}>
                                            <div onClick={() => toggleSubject(s.id)}
                                                className={`p-3 rounded-3 border d-flex justify-content-between align-items-center cursor-pointer transition-all ${selectedSubjectIds.includes(s.id) ? 'border-success bg-success-subtle' : 'bg-white'}`}>
                                                <div className="overflow-hidden">
                                                    <div className="fw-bold text-dark text-truncate small">{s.subjectName}</div>
                                                    <div className="text-muted" style={{fontSize:'0.7rem'}}>{s.subjectCode} | <span className="text-success fw-bold">{s.semester}</span></div>
                                                </div>
                                                {selectedSubjectIds.includes(s.id) && <FontAwesomeIcon icon={faCheckCircle} className="text-success h5 mb-0" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 bg-white">
                    <div className="me-auto ms-3 d-none d-sm-block">
                        {selectedFaculty && (
                            <div className="small">
                                Target: <strong>{selectedFaculty.fullName}</strong> | Selected: <span className="badge bg-success">{selectedSubjectIds.length}</span>
                            </div>
                        )}
                    </div>
                    <Button variant="light" className="px-4 rounded-pill" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button onClick={handleBulkAssign} disabled={!selectedFaculty || selectedSubjectIds.length === 0} 
                        style={{backgroundColor:'#004d40', border:'none', padding:'10px 40px', borderRadius:'50px'}}>
                        Assign Workload <FontAwesomeIcon icon={faArrowRight} className="ms-2"/>
                    </Button>
                </Modal.Footer>
            </Modal>
        </ContentBody>
    );
}