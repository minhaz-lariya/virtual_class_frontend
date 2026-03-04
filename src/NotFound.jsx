import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faArrowLeft, faHome } from "@fortawesome/free-solid-svg-icons";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
            <style>{`
                .error-code {
                    font-size: 120px;
                    font-weight: 900;
                    color: #004d40;
                    line-height: 1;
                    margin-bottom: 20px;
                    opacity: 0.2;
                }
                .not-found-card {
                    max-width: 500px;
                    border: none;
                    border-radius: 20px;
                }
                .btn-go-back {
                    background-color: #004d40;
                    color: white;
                    border-radius: 10px;
                    padding: 10px 25px;
                    transition: 0.3s;
                }
                .btn-go-back:hover {
                    background-color: #00332b;
                    color: white;
                    transform: translateY(-2px);
                }
                .btn-home {
                    border-radius: 10px;
                    padding: 10px 25px;
                }
            `}</style>

            <div className="card not-found-card shadow-lg p-5 text-center">
                <div className="error-code">404</div>
                
                <div className="mb-4">
                    <FontAwesomeIcon 
                        icon={faExclamationTriangle} 
                        className="text-warning mb-3" 
                        style={{ fontSize: '50px' }} 
                    />
                    <h2 className="fw-bold" style={{ color: '#004d40' }}>Page Not Found</h2>
                    <p className="text-muted">
                        Oops! The page you are looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                    {/* REDIRECT TO PREVIOUS PAGE */}
                    <button 
                        onClick={() => navigate(-1)} 
                        className="btn btn-go-back shadow-sm"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}