import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Landing = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const features = [
        {
            title: "Discover Events",
            desc: "Find sports matches and training sessions happening right now in your neighborhood.",
            icon: "/feature-connect.png"
        },
        {
            title: "Connect & Play",
            desc: "Build your network of sports partners and join communities that share your passion.",
            icon: "/feature-play.png"
        },
        {
            title: "Competitive Edge",
            desc: "Track your performance, master your favorite sports, and climb the local leaderboards.",
            icon: "/feature-compete-new.png"
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            backgroundImage: 'url("/hero-bg-tokyo.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            color: '#a9b1d6',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden',
            position: 'relative',
            backgroundColor: '#1a1b26'
        }}>
            {/* Navbar */}
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                padding: '25px 80px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 1000,
                background: 'rgba(26, 27, 38, 0.8)',
                backdropFilter: 'blur(30px)',
                borderBottom: '1px solid rgba(122, 162, 247, 0.2)',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    fontSize: '2.2rem',
                    fontWeight: '900',
                    background: 'linear-gradient(45deg, #9ece6a, #7aa2f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '1px',
                    textShadow: '0 5px 15px rgba(0,0,0,0.3)'
                }}>
                    SportShare
                </div>
                <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                    <Link to="/login" style={{
                        color: 'rgba(169, 177, 214, 0.9)',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '1.1rem',
                        transition: 'color 0.3s',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>Login</Link>
                    <Link to="/signup" style={{
                        background: 'linear-gradient(45deg, #9ece6a, #7aa2f7)',
                        color: '#1a1b26',
                        padding: '12px 35px',
                        borderRadius: '35px',
                        textDecoration: 'none',
                        fontWeight: '900',
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.3s',
                        display: 'inline-block'
                    }}>Join Now</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                height: '100vh',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    zIndex: 10,
                    textAlign: 'center',
                    maxWidth: '650px',
                    padding: '40px 50px',
                    background: 'rgba(26, 27, 38, 0.7)',
                    backdropFilter: 'blur(45px)',
                    borderRadius: '40px',
                    border: '1px solid rgba(158, 206, 106, 0.2)',
                    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.85)',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1)'
                }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        fontWeight: '950',
                        marginBottom: '20px',
                        lineHeight: '1.2',
                        color: '#c0caf5',
                        letterSpacing: '-1.5px',
                        textShadow: '0 10px 20px rgba(0,0,0,0.5)'
                    }}>
                        Elevate Your <span style={{ color: '#ff9e64' }}>Game</span>,<br />
                        Anywhere, <span style={{ color: '#9ece6a' }}>Anytime</span>.
                    </h1>
                    <p style={{
                        fontSize: '1.2rem',
                        color: '#787c99',
                        marginBottom: '35px',
                        maxWidth: '550px',
                        margin: '0 auto 35px',
                        lineHeight: '1.6'
                    }}>
                        The ultimate social platform for sports enthusiasts.
                        Join events, build your stats, and connect with players around you.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Link to="/signup" style={{
                            padding: '16px 50px',
                            fontSize: '1.2rem',
                            fontWeight: '800',
                            background: '#9ece6a',
                            color: '#1a1b26',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            transition: 'all 0.3s',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                        }}>Get Started</Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{
                padding: '120px 20px',
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '3rem', color: '#c0caf5', marginBottom: '20px', fontWeight: '900', textShadow: '0 5px 15px rgba(0,0,0,0.7)' }}>Built for Champions</h2>
                    <div style={{ width: '100px', height: '5px', background: 'linear-gradient(90deg, #9ece6a, #ff9e64)', margin: '0 auto', borderRadius: '5px', opacity: 0.8 }}></div>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '50px',
                    width: '100%'
                }}>
                    {features.map((f, i) => (
                        <div key={i} style={{
                            padding: '60px 45px',
                            background: 'rgba(22, 22, 30, 0.8)',
                            border: '1px solid rgba(122, 162, 247, 0.15)',
                            borderRadius: '45px',
                            textAlign: 'center',
                            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            cursor: 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            backdropFilter: 'blur(35px)',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
                        }}>
                            <div style={{
                                width: '140px',
                                height: '140px',
                                background: '#1a1b26',
                                borderRadius: '35px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: '35px',
                                border: '1px solid rgba(122, 162, 247, 0.2)',
                                boxShadow: `0 15px 35px -10px ${i === 0 ? 'rgba(122, 162, 247, 0.4)' : i === 1 ? 'rgba(187, 154, 247, 0.4)' : 'rgba(158, 206, 106, 0.4)'}`,
                                overflow: 'hidden',
                                position: 'relative'
                            }}>
                                <img src={f.icon} alt={f.title} style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: 'scale(1.1)', // Subtle zoom for better fit
                                    filter: 'brightness(1.1) contrast(1.1)',
                                    borderRadius: '25px', // Match container slightly
                                }} />
                            </div>
                            <h3 style={{ fontSize: '1.8rem', color: '#c0caf5', marginBottom: '15px', fontWeight: '800' }}>{f.title}</h3>
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#787c99' }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '80px 20px',
                textAlign: 'center',
                borderTop: '1px solid rgba(122, 162, 247, 0.15)',
                background: 'rgba(22, 22, 30, 0.95)',
                color: '#565f89',
                position: 'relative',
                zIndex: 1,
                fontSize: '1.1rem'
            }}>
                <p>&copy; 2026 SportShare. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Landing;
