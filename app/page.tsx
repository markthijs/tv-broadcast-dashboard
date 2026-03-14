import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Haal alle gevolgde producties en artiesten op
  const { data: artists } = await supabase
    .from('artists')
    .select('id, name, artist_productions(production_id, productions(title))')

  // Haal de titels op die we volgen
  const { data: productions } = await supabase
    .from('productions')
    .select('title')

  const trackedTitles = productions?.map(p => p.title) ?? []

  // Haal alleen broadcasts op die matchen met gevolgde titels, laatste 30 dagen
  const { data: broadcasts, error } = await supabase
    .from('broadcasts')
    .select('title, channel_id, season, episode, start_time')
    .in('title', trackedTitles)
    .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('start_time', { ascending: false })

  if (error) return <pre className="p-8 text-red-500">{JSON.stringify(error, null, 2)}</pre>

  const hits = broadcasts ?? []

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
      <p className="text-gray-500 mb-6">{hits.length} uitzendingen gevonden (laatste 30 dagen)</p>
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
              <td className="p-2 border">
                {new Date(b.start_time).toLocaleString('nl-BE')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
