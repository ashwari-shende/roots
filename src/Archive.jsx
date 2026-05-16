import { theme } from './theme'

const mockStories = [
  {
    id: 1,
    name: 'Rosa Mendez',
    year: '1974',
    location: 'East Los Angeles',
    preview: 'The summer my mother taught me to make tamales, the whole block smelled like masa for three days...',
    theme: 'Food & Family'
  },
  {
    id: 2,
    name: 'James Okafor',
    year: '1989',
    location: 'Lagos → Chicago',
    preview: 'I arrived with one suitcase and my father\'s watch. The airport felt like the inside of a cloud...',
    theme: 'Migration'
  },
  {
    id: 3,
    name: 'Mei-Ling Chen',
    year: '1961',
    location: 'San Francisco Chinatown',
    preview: 'The herbalist on Stockton Street knew every family\'s secrets. He never charged us when times were hard...',
    theme: 'Community'
  }
]

export default function Archive() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.bgPrimary,
      fontFamily: theme.fonts.body,
      padding: '3rem 2rem',
    }}>
      <h1 style={{
        fontFamily: theme.fonts.heading,
        color: theme.colors.textPrimary,
        fontSize: '2.5rem',
        marginBottom: '0.5rem',
      }}>
        Community Archive
      </h1>
      <p style={{ color: theme.colors.textMuted, marginBottom: '3rem' }}>
        Stories preserved by the community, for the community
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '720px', margin: '0 auto' }}>
        {mockStories.map(story => (
          <div key={story.id} style={{
            backgroundColor: theme.colors.bgSecondary,
            borderRadius: '12px',
            padding: '1.5rem',
            borderLeft: `4px solid ${theme.colors.forestGreen}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: theme.colors.textPrimary, fontWeight: 500 }}>{story.name}</span>
              <span style={{ color: theme.colors.warmSand, fontSize: '0.85rem' }}>{story.theme}</span>
            </div>
            <div style={{ color: theme.colors.textMuted, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {story.location} · {story.year}
            </div>
            <p style={{ color: theme.colors.textPrimary, lineHeight: 1.7, margin: 0, fontFamily: theme.fonts.heading }}>
              "{story.preview}"
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}