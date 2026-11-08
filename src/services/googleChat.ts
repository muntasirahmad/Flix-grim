export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAAAAAAAAA"
  displayName?: string;
  type?: string;
  spaceType?: string;
}

export interface GoogleChatMessage {
  name?: string;
  text: string;
  sender?: {
    name?: string;
    displayName?: string;
  };
  createTime?: string;
}

/**
 * List the Google Chat spaces that the authenticated user belongs to.
 */
export async function listUserSpaces(accessToken: string): Promise<GoogleChatSpace[]> {
  const url = 'https://chat.googleapis.com/v1/spaces';
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Chat API error (list spaces):', response.status, errorText);
    throw new Error(`Google Chat API error: ${response.statusText} (${response.status})`);
  }

  const data = await response.json();
  return (data.spaces || []).map((s: any) => ({
    name: s.name,
    displayName: s.displayName || s.name.replace('spaces/', 'Chat Space '),
    type: s.type,
    spaceType: s.spaceType,
  }));
}

/**
 * Post a message or AI insight directly to a Google Chat space.
 */
export async function postMessageToSpace(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<GoogleChatMessage> {
  // Ensure spaceName has spaces/ prefix
  const formattedParent = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
  const url = `https://chat.googleapis.com/v1/${formattedParent}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Chat API error (post message):', response.status, errorText);
    throw new Error(`Google Chat API error: ${response.statusText} (${response.status})`);
  }

  return await response.json();
}

/**
 * Create a new Google Chat space for Flix Grim discussions.
 */
export async function createChatSpace(
  accessToken: string,
  displayName: string
): Promise<GoogleChatSpace> {
  const url = 'https://chat.googleapis.com/v1/spaces';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      displayName,
      spaceType: 'SPACE',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Chat API error (create space):', response.status, errorText);
    throw new Error(`Google Chat API error: ${response.statusText} (${response.status})`);
  }

  return await response.json();
}
