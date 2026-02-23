import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import EventContext from '../context/EventContext';

const Stats = () => {
    const { user } = useContext(AuthContext);
    const { events, getEvents, loading } = useContext(EventContext);

    useEffect(() => {
        getEvents();
    }, []);

    if (loading || !events) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading Stats...</div>;

    // Project Colors (Tokyo Night Inspired + Extra Vibrancy)
    const colors = [
        '#7aa2f7', // Blue
        '#9ece6a', // Green
        '#e0af68', // Orange/Yellow
        '#f7768e', // Pink/Red
        '#bb9af7', // Purple
        '#7dcfff', // Cyan
        '#ff9e64', // Vivid Orange
        '#00ffc8'  // Neon Green
    ];

    // Data Processing
    const now = new Date();
    const myPastEvents = events.filter(e => {
        const isPast = new Date(e.date) < now;
        const isCreator = (e.user._id || e.user) === user?._id;
        const isParticipant = e.participants.some(p => (p.user?._id || p.user) === user?._id);
        return isPast && (isCreator || isParticipant);
    });

    // 1. Sport Breakdown (Aggregation with Tie-breaker logic)
    const sportStats = {};
    myPastEvents.forEach(e => {
        const sport = e.sportType || 'Other';
        const eventDate = new Date(e.date);

        if (!sportStats[sport]) {
            sportStats[sport] = { count: 0, lastPlayed: eventDate };
        }

        sportStats[sport].count++;
        if (eventDate > sportStats[sport].lastPlayed) {
            sportStats[sport].lastPlayed = eventDate;
        }
    });

    // Sort by count (desc), then by lastPlayed (desc) for ties
    const sortedSports = Object.entries(sportStats).sort((a, b) => {
        if (b[1].count !== a[1].count) {
            return b[1].count - a[1].count;
        }
        return b[1].lastPlayed - a[1].lastPlayed;
    }).map(([sport, stat]) => [sport, stat.count]);

    const topSport = sortedSports[0]?.[0] || 'None yet';
    const totalEvents = myPastEvents.length;

    // 2. Activity Trend (Last 7 Days)
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
            date: d.toLocaleDateString('en-US', { weekday: 'short' }),
            count: myPastEvents.filter(e => new Date(e.date).toDateString() === d.toDateString()).length,
            fullDate: d.toDateString()
        };
    }).reverse();

    const maxDayCount = Math.max(...last7Days.map(d => d.count), 1);

    return (
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', color: 'white' }}>
            <h2 style={{ color: '#7aa2f7', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span>📈</span> My Analytics
            </h2>

            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="card" style={{ textAlign: 'center', padding: '25px', background: '#1a1b26', border: '1px solid #24283b', borderBottom: '3px solid #bb9af7', borderRadius: '12px', transition: 'transform 0.3s ease' }}>
                    <div style={{ color: '#a9b1d6', fontSize: '1rem', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Events</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#bb9af7', textShadow: '0 0 10px rgba(187, 154, 247, 0.3)' }}>{totalEvents}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '25px', background: '#1a1b26', border: '1px solid #24283b', borderBottom: '3px solid #e0af68', borderRadius: '12px' }}>
                    <div style={{ color: '#a9b1d6', fontSize: '1rem', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Most Played</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e0af68', textShadow: '0 0 10px rgba(224, 175, 104, 0.3)' }}>{topSport}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '25px', background: '#1a1b26', border: '1px solid #24283b', borderBottom: '3px solid #9ece6a', borderRadius: '12px' }}>
                    <div style={{ color: '#a9b1d6', fontSize: '1rem', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Sports Played</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#9ece6a', textShadow: '0 0 10px rgba(158, 206, 106, 0.3)' }}>{Object.keys(sportStats).length}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                {/* Sport Mix (SVG Donut Chart) */}
                <div className="card" style={{ background: '#1a1b26', padding: '25px', border: '1px solid #24283b', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#7dcfff', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>📊</span> Sport Breakdown
                    </h3>
                    {sortedSports.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {/* SVG Donut */}
                            <div style={{ position: 'relative', width: '220px', height: '220px' }}>
                                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                                    {sortedSports.map(([sport, count], index) => {
                                        const radius = 38;
                                        const circumference = 2 * Math.PI * radius;
                                        const percent = (count / totalEvents) * 100;
                                        const offset = sortedSports.slice(0, index).reduce((acc, [_, c]) => acc + (c / totalEvents) * 100, 0);
                                        const color = colors[index % colors.length];

                                        return (
                                            <circle
                                                key={sport}
                                                cx="50"
                                                cy="50"
                                                r={radius}
                                                fill="transparent"
                                                stroke={color}
                                                strokeWidth="12" // Slightly thinner for better definition
                                                strokeDasharray={`${(percent * circumference) / 100} ${circumference}`}
                                                strokeDashoffset={`${-(offset * circumference) / 100}`}
                                                style={{
                                                    transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    filter: `drop-shadow(0 0 3px ${color}aa)` // Sharper shadow, less "bleed"
                                                }}
                                            />
                                        );
                                    })}
                                    <circle cx="50" cy="50" r="32" fill="#1a1b26" />
                                </svg>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>{totalEvents}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#565f89', textTransform: 'uppercase', letterSpacing: '1px' }}>Events</div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div style={{ flex: 1, minWidth: '180px' }}>
                                {sortedSports.map(([sport, count], index) => {
                                    const percent = Math.round((count / totalEvents) * 100);
                                    const color = colors[index % colors.length];
                                    return (
                                        <div key={sport} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '12px',
                                            padding: '8px 12px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: '6px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '14px', height: '14px', borderRadius: '4px', background: color, boxShadow: `0 0 8px ${color}` }}></div>
                                                <span style={{ fontSize: '1rem', fontWeight: '500' }}>{sport}</span>
                                            </div>
                                            <span style={{ fontSize: '0.9rem', color: '#a9b1d6', fontWeight: 'bold' }}>{percent}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#565f89', padding: '20px' }}>No activity data yet.</div>
                    )}
                </div>

                {/* Weekly Activity (Bar Chart) */}
                <div className="card" style={{ background: '#1a1b26', padding: '25px', border: '1px solid #24283b', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#ff9e64', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>📅</span> Recent Activity
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '150px', paddingTop: '20px' }}>
                        {last7Days.map((day, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '35px',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        height: day.count > 0 ? `${(day.count / maxDayCount) * 100}%` : '4px',
                                        background: day.count > 0 ? '#ff9e64' : 'rgba(255, 158, 100, 0.1)',
                                        borderRadius: '4px 4px 2px 2px',
                                        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        boxShadow: day.count > 0 ? '0 0 15px rgba(255, 158, 100, 0.4)' : 'none',
                                        border: day.count > 0 ? '1px solid #ff9e64' : '1px solid transparent'
                                    }}>
                                        {day.count > 0 && (
                                            <span style={{
                                                position: 'absolute',
                                                top: '-25px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                fontSize: '0.8rem',
                                                color: '#ff9e64',
                                                fontWeight: 'bold'
                                            }}>
                                                {day.count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: '#565f89', marginTop: '5px' }}>{day.date}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quote / Motivation */}
            <div style={{ marginTop: '50px', textAlign: 'center', padding: '40px', borderTop: '1px solid #24283b' }}>
                <p style={{ fontStyle: 'italic', color: '#565f89', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    "Success is not final, failure is not fatal: it is the courage to continue that counts."
                </p>
            </div>
        </div>
    );
};

export default Stats;
