import axios, { AxiosInstance } from 'axios';
import { FreshdeskConversation, FreshdeskTicket, HubSpotContact } from '../types';

export class FreshdeskService {
  private api: AxiosInstance;

  constructor(domain: string, apiKey: string) {
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
  async getTickets(page = 1, perPage = 30): Promise<FreshdeskTicket[]> {
    try {
      const response = await this.api.get('/tickets', {
        params: {
          page,
          per_page: perPage,
          include: 'requester'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Freshdesk tickets:', error);
      throw new Error('Failed to fetch tickets from Freshdesk');
    }
  }
  async getTicketById(ticketId: number): Promise<FreshdeskTicket> {
    try {
      const response = await this.api.get(`/tickets/${ticketId}`, {
        params: {
          include: 'requester'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Freshdesk ticket:', error);
      throw new Error('Failed to fetch ticket from Freshdesk');
    }
  }

  async getTicketConversations(ticketId: number): Promise<FreshdeskConversation[]> {
    try {
      const response = await this.api.get(`/tickets/${ticketId}/conversations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Freshdesk conversations:', error);
      throw new Error('Failed to fetch conversations from Freshdesk');
    }
  }



 

  async testConnection(): Promise<boolean> {
    try {
      await this.api.get('/tickets?per_page=1');
      return true;
    } catch (error) {
        
      return false;
    }
  }
}

export class HubSpotService {
  private api: AxiosInstance;

  constructor(accessToken: string) {
    this.api = axios.create({
      baseURL: 'https://api.hubapi.com',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }



  async testConnection(): Promise<boolean> {
    try {
      await this.api.get('/crm/v3/objects/contacts?limit=1');
      return true;
    } catch (error) {
      return false;
    }
  }
  async getContactByEmail(email: string): Promise<HubSpotContact | null> {
    try {
      const response = await this.api.get('/crm/v3/objects/contacts/search', {
        data: {
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
        }
      });

      const contacts = response.data.results;
      return contacts.length > 0 ? contacts[0] : null;
    } catch (error) {
      console.error('Error fetching HubSpot contact:', error);
      return null;
    }
  }

}