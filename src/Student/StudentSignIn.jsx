import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faSignInAlt, faEye, faEyeSlash, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import Swal from 'sweetalert2';

import { requestPost } from '../../Services/AxiosService';
import { rootContext } from '../App';

export default function StudentSignIn() {
    const rootCtx = useContext(rootContext);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    // ================= FORGOT PASSWORD LOGIC =================
    const handleForgotPassword = async (e) => {
        e.preventDefault();

        const { value: email } = await Swal.fire({
            title: 'Reset Password',
            input: 'email',
            inputLabel: 'Enter your admin email address',
            inputPlaceholder: 'admin@university.com',
            showCancelButton: true,
            confirmButtonColor: '#004d40',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Reset Password',
            inputValidator: (value) => {
                if (!value) return 'Email is required to reset password!';
            }
        });

        if (email) {
            rootCtx.setLoading(true);
            try {
                // Calling your C# [HttpPost("forgotPassword")]
                const res = await requestPost(`AdminMaster/forgotPassword?email=${email}`);
                rootCtx.setLoading(false);

                if (res?.status === "OK") {
                    Swal.fire({
                        icon: 'success',
                        title: 'Password Reset!',
                        html: `Your temporary password is: <br><br><b style="font-size: 1.5rem; color: #004d40;">${res.result}</b><br><br>Please use this to login and change it immediately.`,
                        confirmButtonColor: '#004d40',
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: res?.result || "Email not found",
                        confirmButtonColor: '#004d40',
                    });
                }
            } catch (error) {
                rootCtx.setLoading(false);
                Swal.fire('Error', 'Server connection failed', 'error');
            }
        }
    };

    // ================= SIGN IN LOGIC (FORMIK) =================
    const formik = useFormik({
        initialValues: {
            email: '',
            password: ''
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Email is required'),
            password: Yup.string().min(6, 'Must be at least 6 characters').required('Password is required'),
        }),
        onSubmit: async (values) => {
            rootCtx.setLoading(true);
            try {
                const res = await requestPost(`Student/SignIn?email=${values.email}&password=${values.password}`);
                rootCtx.setLoading(false);

                if (res?.status === "OK") {
                    localStorage.setItem("studentUser", JSON.stringify(res.result));
                    localStorage.setItem("studentUserId", res.result.id);
                    localStorage.setItem("StudentUserName", res.result.fullName);

                    Swal.fire({
                        icon: 'success',
                        title: 'Welcome Back!',
                        text: `Logged in as ${res.result.fullName}`,
                        timer: 1500,
                        showConfirmButton: false
                    });

                    navigate('/Student/Dashboard');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Login Failed',
                        text: res?.result || "Invalid Credentials",
                        confirmButtonColor: '#004d40'
                    });
                }
            } catch (err) {
                rootCtx.setLoading(false);
                Swal.fire('Error', 'Internal Server Error', 'error');
            }
        },
    });

    return (
        <div className="login-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
            <style>{`
                .login-card { border-radius: 24px; border: none; width: 100%; max-width: 450px; background: #ffffff; }
                .input-group-text { background-color: #f8f9fa; border-right: none; color: #004d40; }
                .form-control { border-left: none; background-color: #f8f9fa; height: 50px; }
                .form-control:focus { background-color: #fff; box-shadow: none; border-color: #dee2e6; }
                .btn-login { background-color: #004d40; border: none; padding: 14px; border-radius: 12px; font-weight: 600; transition: 0.3s; }
                .btn-login:hover { background-color: #00332b; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,77,64,0.2); }
                .error-text { font-size: 0.75rem; color: #dc3545; font-weight: 600; }
                .cursor-pointer { cursor: pointer; }
            `}</style>

            <div className="card login-card shadow-lg p-4 p-md-5">
                <div className="text-center mb-4">
                    <div className="bg-success-subtle d-inline-flex p-3 rounded-circle mb-3" style={{ background: '#e0f2f1' }}>
                        <FontAwesomeIcon icon={faGraduationCap} style={{ fontSize: "35px", color: '#004d40' }} />
                    </div>
                    <h3 className="fw-bold" style={{ color: '#004d40' }}>Student Portal</h3>
                    <p className="text-muted small text-uppercase letter-spacing-1">Secure Management Login</p>
                </div>

                <form onSubmit={formik.handleSubmit}>
                    {/* Email Field */}
                    <div className="mb-4">
                        <label className="form-label small fw-bold text-muted">EMAIL ADDRESS</label>
                        <div className={`input-group rounded-3 overflow-hidden ${formik.touched.email && formik.errors.email ? 'border border-danger' : ''}`}>
                            <span className="input-group-text">
                                <FontAwesomeIcon icon={faEnvelope} />
                            </span>
                            <input 
                                type="email" 
                                className="form-control"
                                placeholder="name@example.com" 
                                {...formik.getFieldProps('email')}
                            />
                        </div>
                        {formik.touched.email && formik.errors.email && (
                            <div className="error-text mt-1">{formik.errors.email}</div>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between mb-1">
                            <label className="form-label small fw-bold text-muted text-uppercase">Password</label>
                            <a href="#" onClick={handleForgotPassword} className="small text-decoration-none text-success fw-bold">Forgot Password?</a>
                        </div>
                        <div className={`input-group rounded-3 overflow-hidden ${formik.touched.password && formik.errors.password ? 'border border-danger' : ''}`}>
                            <span className="input-group-text">
                                <FontAwesomeIcon icon={faLock} />
                            </span>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="form-control"
                                placeholder="••••••••" 
                                {...formik.getFieldProps('password')}
                            />
                            <span 
                                className="input-group-text border-start-0 cursor-pointer" 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-muted" />
                            </span>
                        </div>
                        {formik.touched.password && formik.errors.password && (
                            <div className="error-text mt-1">{formik.errors.password}</div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="btn btn-login text-white w-100 mt-2"
                        disabled={formik.isSubmitting}
                    >
                        {formik.isSubmitting ? (
                            <span>Verifying...</span>
                        ) : (
                            <>Sign In <FontAwesomeIcon icon={faSignInAlt} className="ms-2" /></>
                        )}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <p className="text-muted" style={{ fontSize: '0.7rem' }}>
                        © 2026 IQRA VIRTUAL LMS | SYSTEM v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}