import { theme } from './theme'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
    const navigate = useNavigate()

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: theme.colors.bgPrimary,
            fontFamily: theme.fonts.body,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem'
        }}>

            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌱</div>

            <h1 style={{
                fontFamily: theme.fonts.heading,
                fontSize: '5rem',
                color: theme.colors.textPrimary,
                fontWeight: 600,
                margin: '0 0 1.5rem 0',
            }}>
                Roots
            </h1>

            <p style={{
                fontSize: '1.2rem',
                color: theme.colors.textMuted,
                marginBottom: '3rem',
                maxWidth: '480px',
                lineHeight: 1.6
            }}>
                Where family stories become community memory
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/record')}
                    style={{
                        padding: '0.9rem 2rem',
                        fontSize: '1rem',
                        backgroundColor: theme.colors.forestGreen,
                        color: theme.colors.bgSecondary,
                        border: `1px solid ${theme.colors.textMuted}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontFamily: theme.fonts.body,
                    }}>
                    Record a Story
                </button>

                <button
                    onClick={() => navigate('/archive')}
                    style={{
                        padding: '0.9rem 2rem',
                        fontSize: '1rem',
                        backgroundColor: theme.colors.mediumGreen,
                        color: theme.colors.bgSecondary,
                        border: `1px solid ${theme.colors.textMuted}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontFamily: theme.fonts.body,
                    }}>
                    Explore Archive
                </button>
                <button
                    onClick={() => navigate('/chat')}
                    style={{
                        padding: '0.9rem 2rem',
                        fontSize: '1rem',
                        backgroundColor: theme.colors.deepForest,
                        color: theme.colors.bgSecondary,
                        border: `1px solid ${theme.colors.textMuted}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontFamily: theme.fonts.body,
                    }}>
                    Ask the Archive
                </button>
            </div>

        </div>
    )
}