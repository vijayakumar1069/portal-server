import { RequestHandler } from "express";
import { AuthRequest } from "../types";
import { User } from "../models/user.js";
import { FreshdeskService, HubSpotService } from "../services/connection.services.js";


export const freshdeskIntegrationSaveController = async (req: AuthRequest, res: any): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { freshdeskApiKey, freshdeskDomain } = req.body;

    if (!freshdeskApiKey || !freshdeskDomain) {
      res.status(400).json({
        success: false,
        message: "Freshdesk API key and domain are required",
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if another user already has the same Freshdesk API key
    const existingUser = await User.findOne({
      freshdeskApiKey: freshdeskApiKey,
      _id: { $ne: userId } // Exclude current user
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "This Freshdesk API key is already in use by another user",
      });
      return;
    }

    // Test Freshdesk connection
    const freshdeskService = new FreshdeskService(freshdeskDomain, freshdeskApiKey);
    const isConnected = await freshdeskService.testConnection();

    if (!isConnected) {
      res.status(400).json({
        success: false,
        message: "Failed to connect to Freshdesk. Invalid credentials.",
      });
      return;
    }

    // Save credentials
    user.freshdeskApiKey = freshdeskApiKey;
    user.freshdeskDomain = freshdeskDomain;
    await user.save();

    res.json({
      success: true,
      message: "Freshdesk credentials saved successfully",
      data: {
        freshdeskConnected: true,
        freshdeskDomain: freshdeskDomain,
      },
    });
  } catch (error) {
    console.error("Freshdesk save error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save Freshdesk credentials",
    });
  }
};

export const hubspotIntegrationSaveController: RequestHandler = async (req: AuthRequest, res): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { hubspotAccessToken } = req.body;

    if (!hubspotAccessToken) {
      res.status(400).json({
        success: false,
        message: "HubSpot Access Token is required",
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Check if another user already has the same HubSpot access token
    const existingUser = await User.findOne({
      hubspotAccessToken: hubspotAccessToken,
      _id: { $ne: userId } // Exclude current user
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "This HubSpot access token is already in use by another user",
      });
      return;
    }

    // Test HubSpot connection
    const hubspotService = new HubSpotService(hubspotAccessToken);
    const isConnected = await hubspotService.testConnection();

    if (!isConnected) {
      res.status(400).json({
        success: false,
        message: "Failed to connect to HubSpot. Invalid token.",
      });
      return;
    }

    // Save credentials
    user.hubspotAccessToken = hubspotAccessToken;
    await user.save();

    res.json({
      success: true,
      message: "HubSpot credentials saved successfully",
      data: {
        hubspotConnected: true,
      },
    });
  } catch (error) {
    console.error("HubSpot save error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save HubSpot credentials",
    });
  }
};
export const integrationStatusController: RequestHandler = async (req: AuthRequest, res): Promise<void> => {
     try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);
    
    if (!user) {
       res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Integration status retrieved successfully',
      data: {
        integrations: {
          freshdeskConnected: !!user.freshdeskApiKey && !!user.freshdeskDomain,
          hubspotConnected: !!user.hubspotAccessToken,
          freshdeskDomain: user.freshdeskDomain || null
        }
      }
    });
  } catch (error) {
    console.error('Get integration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integration status'
    });
    return;
  }
}
