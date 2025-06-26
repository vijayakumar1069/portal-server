import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, LoginRequest, SignupRequest } from "../types";
import { User } from "../models/user.js";
import type { StringValue } from "ms";
import { BlacklistedToken } from "../models/blackListedToken";
export const signupController: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { email, password }: SignupRequest = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
       res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
      return;
    }

    const user = new User({ email, password });
    await user.save();

    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN as StringValue || "7d";

    // ✅ Validate types
    if (!jwtSecret) {
       res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
      return;
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

export const loginController: RequestHandler = async (req, res): Promise<void> => {
    try {
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
       res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
       res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN as StringValue || "7d";
    if (!jwtSecret) {
       res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
      return;
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

export const logoutController: RequestHandler = async (req, res): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
      return;
    }

    // Decode the token to get expiry
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & { userId: string; email: string };
    
    // Save token to blacklist with its expiry
    const expiresAt = new Date((decoded.exp || 0) * 1000); // convert exp (in seconds) to milliseconds

    await BlacklistedToken.create({ token, expiresAt });

    // Optional: You may also log or track the user who logged out
    const user = await User.findById(decoded.userId);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: {
        user: user?.toJSON(),
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
    });
  }
};