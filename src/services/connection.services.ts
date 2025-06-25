import axios, { AxiosInstance } from 'axios';

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
}