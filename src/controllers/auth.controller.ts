import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, LoginRequest, SignupRequest } from "../types";
import { User } from "../models/user";
import type { StringValue } from "ms";
export const signupController: RequestHandler = async (req, res) => {
  try {
    const { email, password }: SignupRequest = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const user = new User({ email, password });
    await user.save();

    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN as StringValue || "7d";

    // ✅ Validate types
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    // ✅ Ensure correct typing for both secret and options
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      {
        expiresIn: jwtExpiresIn, // string like "7d" is valid
      }
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        user: user.toJSON(),
      },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

export const loginController: RequestHandler = async (req, res) => {
    try {
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN as StringValue || "7d";
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      {
        expiresIn: jwtExpiresIn, // string like "7d" is valid
      }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
}

export const getUserController: RequestHandler = async (req:AuthRequest, res) => {
    try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user'
    });
  }
}