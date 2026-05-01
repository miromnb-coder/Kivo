export type GmailMessageSummary = {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date?: string;
};

function getHeader(headers: Array<{ name: string; value: string }>, name: string) {
  return headers.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

export async function listGmailMessages(accessToken: string, maxResults = 10): Promise<GmailMessageSummary[]> {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Gmail request failed (${res.status})`);
  }

  const data = await res.json();
  const messages = data.messages ?? [];

  return Promise.all(
    messages.map(async (message: { id: string }) => {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!detailRes.ok) {
        throw new Error(`Gmail message request failed (${detailRes.status})`);
      }

      const detail = await detailRes.json();
      const headers = detail.payload?.headers ?? [];

      return {
        id: message.id,
        subject: getHeader(headers, 'Subject') || 'No subject',
        from: getHeader(headers, 'From') || 'Unknown sender',
        date: getHeader(headers, 'Date'),
        snippet: detail.snippet ?? '',
      };
    }),
  );
}
