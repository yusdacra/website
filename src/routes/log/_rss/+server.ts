import { PUBLIC_BASE_URL } from '$env/static/public';
import { readNote, readNotesList, type Note } from '$lib/notes.ts';

const logUrl = `${PUBLIC_BASE_URL}/log`;

interface NoteData {
      data: Note,
      id: string,
}

export const GET = async ({ }) => {
      const log = readNotesList().map((id) => {return { data: readNote(id), id }})
      return new Response(
            render(log),
            {
            headers: {
                  'content-type': 'application/xml',
                  'cache-control': 'no-store',
            }
      })
};

const render = (log: NoteData[]) => `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
  <atom:link href="${logUrl}/_rss" rel="self" type="application/rss+xml" />
  <title>dusk's notes (@gaze.systems)</title>
  <link>${logUrl}</link>
  <description>a collection of random notes i write whenever, aka my microblogging spot</description>
  ${log.map((note) => `<item>
  <guid>${logUrl}/?id=${note.id}</guid>
  <link>${logUrl}/?id=${note.id}</link>
  <description>${note.data.content}</description>
  <pubDate>${new Date(note.data.published).toUTCString()}</pubDate>
  </item>`).join('')}
  </channel>
  </rss>
  `;