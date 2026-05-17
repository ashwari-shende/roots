import { useState, useEffect } from 'react';
import { theme } from './theme'
import { useNavigate } from 'react-router-dom';
const capitalizeTheme = (theme) => {
    if (!theme) return 'Other';
    return theme.split(',')
        .map(t => t.trim().charAt(0).toUpperCase() + t.trim().slice(1).toLowerCase())
        .join(', ');
}

export default function Archive() {
    const navigate = useNavigate()
    const [selectedStory, setSelectedStory] = useState(null);
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/stories`)
            .then(res => res.json())
            .then(data => {
                setStories(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: theme.colors.bgPrimary,
            fontFamily: theme.fonts.body,
            display: 'flex',
            flexDirection: 'column',
        }}>
            <header style={{
                padding: '1.25rem 2rem',
                borderBottom: `1px solid ${theme.colors.bgSecondary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3rem 2rem',
            }}>
                <button onClick={() => navigate('/')} style={{
                    background: 'none', border: 'none',
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                }}>
                    ← Roots
                </button>
                <div>
                    <h1 style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.textPrimary,
                        fontSize: '2.5rem',
                        marginBottom: '0.5rem',
                        marginTop: 0,
                    }}>
                        Community Archive
                    </h1>
                    <p style={{ color: theme.colors.textMuted, margin: 0 }}>
                        Stories preserved by the community, for the community
                    </p>
                </div>
                <button onClick={() => navigate('/chat')} style={{
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.9rem',
                    backgroundColor: 'transparent',
                    color: theme.colors.warmSand,
                    border: `1px solid ${theme.colors.warmSand}`,
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontFamily: theme.fonts.body,
                    whiteSpace: 'nowrap',
                }}>
                    Ask the Archive
                </button>
            </header>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '2.5rem',
                    maxWidth: '720px',
                    margin: '0 auto',
                    display: 'flex',
                    padding: '2rem',
                }}>
                    {loading && (
                        <p style={{ color: theme.colors.textMuted }}>Loading stories...</p>
                    )}
                    {!loading && stories.length === 0 && (
                        <p style={{ color: theme.colors.textMuted }}>No stories yet. Be the first to record one!</p>
                    )}
                    {stories.map(story => (
                        <div key={story.storyId} onClick={() => setSelectedStory(story)} style={{
                            backgroundColor: theme.colors.bgSecondary,
                            borderRadius: '12px',
                            padding: '1.5rem',
                            borderLeft: `4px solid ${theme.colors.forestGreen}`,
                            cursor: 'pointer',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: theme.colors.textPrimary, fontWeight: 500 }}>{story.narratorName || story.name || 'Anonymous'}</span>
                                <span style={{ color: theme.colors.warmSand, fontSize: '0.85rem' }}>
                                    {capitalizeTheme(story.theme)}
                                </span>
                            </div>
                            <div style={{ color: theme.colors.textMuted, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                                {story.location || 'Unknown Location'} · {story.year || 'Unknown Date'}
                            </div>
                            <p style={{ color: theme.colors.textPrimary, lineHeight: 1.7, margin: 0, fontFamily: theme.fonts.heading }}>
                                "{story.preview || story.previewQuote || 'No Preview Available'}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {selectedStory && (
                <div onClick={() => setSelectedStory(null)} style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        backgroundColor: theme.colors.bgSecondary,
                        borderRadius: '12px',
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        borderLeft: `4px solid ${theme.colors.forestGreen}`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: theme.colors.textPrimary, fontWeight: 500, fontSize: '1.2rem' }}>
                                {selectedStory.narratorName || selectedStory.name || 'Anonymous'}
                            </span>
                            <button onClick={() => setSelectedStory(null)} style={{
                                background: 'none', border: 'none',
                                color: theme.colors.textMuted, cursor: 'pointer', fontSize: '1.2rem'
                            }}>✕</button>
                        </div>
                        <div style={{ color: theme.colors.textMuted, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            {selectedStory.location || 'Unknown Year'} · {selectedStory.year || 'Unknown Date'}
                        </div>
                        {selectedStory.sourceLanguage && selectedStory.sourceLanguage !== 'English' && (
                            <div style={{ 
                                color: theme.colors.warmSand, 
                                fontSize: '0.85rem', 
                                marginBottom: '1.5rem',
                                fontStyle: 'italic'
                            }}>
                                Original language: {selectedStory.sourceLanguage}
                            </div>
                        )}

                        <p style={{ color: theme.colors.textPrimary, lineHeight: 1.8, fontFamily: theme.fonts.heading }}>
                            {selectedStory.translatedText || selectedStory.originalTranscript || selectedStory.previewQuote || 'No Preview Available'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}