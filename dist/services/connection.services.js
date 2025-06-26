import axios from 'axios';
export class FreshdeskService {
    constructor(domain, apiKey) {
        this.api = axios.create({
            baseURL: `https://${domain}/api/v2`,
            auth: {
                username: apiKey,
                password: 'X'
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    async getTickets(page = 1, perPage = 30) {
        try {
            const response = await this.api.get('/tickets', {
                params: {
                    page,
                    per_page: perPage,
                    include: 'requester'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching Freshdesk tickets:', error);
            throw new Error('Failed to fetch tickets from Freshdesk');
        }
    }
    async getTicketById(ticketId) {
        try {
            const response = await this.api.get(`/tickets/${ticketId}`, {
                params: {
                    include: 'requester'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching Freshdesk ticket:', error);
            throw new Error('Failed to fetch ticket from Freshdesk');
        }
    }
    async getTicketConversations(ticketId) {
        try {
            const response = await this.api.get(`/tickets/${ticketId}/conversations`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching Freshdesk conversations:', error);
            throw new Error('Failed to fetch conversations from Freshdesk');
        }
    }
    async testConnection() {
        try {
            await this.api.get('/tickets?per_page=1');
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
export class HubSpotService {
    constructor(accessToken) {
        this.api = axios.create({
            baseURL: 'https://api.hubapi.com',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    }
    async testConnection() {
        try {
            await this.api.get('/crm/v3/objects/contacts?limit=1');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getContactByEmail(email) {
        try {
            const searchPayload = {
                filterGroups: [{
                        filters: [{
                                value: email,
                                propertyName: 'email',
                                operator: 'EQ'
                            }]
                    }],
                properties: [
                    'email',
                    'firstname',
                    'lastname',
                    'lifecyclestage',
                    'phone',
                    'company',
                    'createdate',
                    'lastmodifieddate'
                ]
            };
            const response = await this.api.post('/crm/v3/objects/contacts/search', searchPayload);
            const contacts = response.data.results;
            if (!contacts || contacts.length === 0) {
                return null;
            }
            const foundContact = contacts[0];
            return foundContact;
        }
        catch (error) {
            return null;
        }
    }
}
