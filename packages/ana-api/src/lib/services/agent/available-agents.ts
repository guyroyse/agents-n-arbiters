// Function to fetch available agents (will eventually call Redis)
export async function fetchAvailableAgents(_gameId?: string) {
  // TODO: Replace with Redis call using gameId
  return {
    location_agents: [
      {
        id: 'stone_chamber',
        name: 'Stone Chamber',
        description: 'Dimly lit chamber with ancient markings',
        capabilities: ['movement', 'examination', 'environment', 'navigation'],
        exits: ['north', 'east']
      }
    ],
    item_agents: [
      {
        id: 'rusty_key',
        name: 'Rusty Key',
        description: 'Old brass key in corner',
        capabilities: ['take', 'examine', 'use', 'inventory'],
        status: 'available',
        location: 'corner of room'
      }
    ],
    npc_agents: []
  }
}