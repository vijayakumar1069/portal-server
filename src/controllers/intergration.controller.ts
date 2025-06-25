import { RequestHandler } from "express";
import { AuthRequest, IntegrationRequest } from "../types";
import { User } from "../models/user";
import { FreshdeskService, HubSpotService } from "../services/connection.services";


export const freshdeskIntegrationSaveController: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { freshdeskApiKey, freshdeskDomain } = req.body;

    if (!freshdeskApiKey || !freshdeskDomain) {
      return res.status(400).json({
        success: false,
        message: "Freshdesk API key and domain are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Test Freshdesk connection
    const freshdeskService = new FreshdeskService(freshdeskDomain, freshdeskApiKey);
    const isConnected = await freshdeskService.testConnection();

    if (!isConnected) {
      return res.status(400).json({
        success: false,
        message: "Failed to connect to Freshdesk. Invalid credentials.",
      });
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
export const hubspotIntegrationSaveController: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { hubspotAccessToken } = req.body;

    if (!hubspotAccessToken) {
      return res.status(400).json({
        success: false,
        message: "HubSpot Access Token is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Test HubSpot connection
    const hubspotService = new HubSpotService(hubspotAccessToken);
    const isConnected = await hubspotService.testConnection();

    if (!isConnected) {
      return res.status(400).json({
        success: false,
        message: "Failed to connect to HubSpot. Invalid token.",
      });
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
export const integrationStatusController: RequestHandler = async (req: AuthRequest, res) => {
     try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
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
  }
}
