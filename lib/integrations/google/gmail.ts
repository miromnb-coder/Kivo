export async function listGmailMessages(accessToken: string) {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Gmail request failed (${res.status})`);
  }

  const data = await res.json();

  const messages = data.messages || [];

  const detailed = await Promise.all(
    messages.map(async (m: any) => {
      const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const j = await r.json();

      const headers = j.payload?.headers || [];

      const subject = headers.find((h: any) => h.name === 'Subject')?.value;
      const from = headers.find((h: any) => h.name === 'From')?.value;

      return { subject, from };
    })
  );

  return detailed;
}
