import { supabase } from '@/lib/supabase'

export default async function Home() {
  // Haal alle gevolgde producties en artesten op
  const { data: artists } = await supabase
    .from('artists')
    .select('id, name, artist_productions(production_id, productions(title))')

  // Haal de titels op die we volgen
  const { data: productions } = await supabase
    .from('productions')
    .select('title')

  const trackedTitles = productions?.map(p => p.title.toLowerCase()) ?? []

  // Haal broadcasts op die matchen
  const { data: broadcasts, error } = await supabase
    .from('broadcasts')
    .select('title, channel_id, season, episode, start_time')
    .order('start_time', { ascending: true })

  if (error) return <pre className="p-8 text-red-500">{JSON.stringify(error, null, 2)}</pre>

  const hits = broadcasts?.filter(b => trackedTitles.includes(b.title.toLowerCase())) ?? []

  // Bouw een lookup: productietitel -> artiestnaam
  const titleToArtist: Record<string, string> = {}
  artists?.forEach(artist => {
    artist.artist_productions?.forEach((ap: any) => {
      const title = ap.productions?.title?.toLowerCase()
      if (title) titleToArtist[title] = artist.name
    })
  })

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">TV Broadcast Tracker</h1>
      <p className="text-gray-500 mb-6">{hits.length} uitzendingen gevonden</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2 border">Acteur</th>
            <th className="p-2 border">Programma</th>
            <th className="p-2 border">Zender</th>
            <th className="p-2 border">Seizoen</th>
            <th className="p-2 border">Aflevering</th>
            <th className="p-2 border">Datum/Tijd</th>
          </tr>
        </thead>
        <tbody>
          {hits.map((b, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="p-2 border">{titleToArtist[b.title.toLowerCase()] ?? '?'}</td>
              <td className="p-2 border">{b.title}</td>
              <td className="p-2 border">{b.channel_id}</td>
              <td className="p-2 border">{b.season ?? '-'}</td>
              <td className="p-2 border">{b.episode ?? '-'}</td>
              <td className="p-2 border">{new Date(b.start_time).toLocaleString('nl-BE', { timeZone: 'Europe/Brussels' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
