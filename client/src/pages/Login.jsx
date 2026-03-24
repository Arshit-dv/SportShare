import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const authContext = useContext(AuthContext);
    const { login, verifyOtp, resendOtp, forgotPassword } = authContext;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [loginEmail, setLoginEmail] = useState('');

    const { email, password } = formData;
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async e => {
        e.preventDefault();

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address');
            return;
        }

        const res = await login({ email, password });
        if (res.requireOtp) {
            setShowOtp(true);
            setLoginEmail(res.email);
            setError('');
            setSuccessMsg(res.msg || 'Please enter the OTP sent to your email.');
        } else if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.msg);
        }
    };

    const onVerifyOtp = async e => {
        e.preventDefault();
        const res = await verifyOtp(loginEmail, otp);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.msg);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setSuccessMsg('');
        const res = await resendOtp(loginEmail);
        if (res.success) {
            setSuccessMsg(res.msg);
        } else {
            setError(res.msg);
        }
    };

    const handleForgotPassword = async () => {
        setError('');
        setSuccessMsg('');
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            setError('Please enter a valid email address in the field above to reset your password');
            return;
        }

        const res = await forgotPassword(email);
        if (res.success) {
            setSuccessMsg(res.msg);
        } else {
            setError(res.msg);
        }
    };

    if (showOtp) {
        return (
            <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
                <h2 style={{ textAlign: 'center', color: 'var(--accent-blue)', marginBottom: '20px' }}>Verify Email</h2>
                <p style={{ textAlign: 'center', marginBottom: '15px' }}>Verify your account: {loginEmail}</p>
                {successMsg && <div style={{ background: 'rgba(56, 204, 119, 0.2)', color: 'var(--success)', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' }}>{successMsg}</div>}
                {error && <div style={{ background: 'rgba(255,0,85,0.2)', color: 'var(--danger)', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
                
                <form onSubmit={onVerifyOtp} className="card">
                     <div className="input-group">
                         <label>Enter 6-digit OTP</label>
                         <input type="text" value={otp} onChange={e => setOtp(e.target.value)} required />
                     </div>
                     <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Verify & Log In</button>
                </form>
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <button type="button" onClick={handleResendOtp} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', textDecoration: 'underline', cursor: 'pointer' }}>
                        Didn't receive code? Resend OTP
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--accent-blue)', marginBottom: '20px' }}>Login</h2>
            {successMsg && <div style={{ background: 'rgba(56, 204, 119, 0.2)', color: 'var(--success)', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' }}>{successMsg}</div>}
            {error && <div style={{ background: 'rgba(255,0,85,0.2)', color: 'var(--danger)', padding: '10px', borderRadius: '5px', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
            <form onSubmit={onSubmit} className="card">
                <div className="input-group">
                    <label>Email Address</label>
                    <input type="email" name="email" value={email} onChange={onChange} required />
                </div>
                <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <label style={{ margin: 0 }}>Password</label>
                        <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
                            Forgot password?
                        </button>
                    </div>
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            )}
                        </button>
                    </div>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>Log In</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '15px' }}>
                Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
        </div>
    );
};

export default Login;
