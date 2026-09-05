const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { sendWelcomeAlertEmail } = require("../services/emailService");

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d"
    });
};

// Register
const register = async (req, res) => {
    try {
        const { name, email, password, phone, district, state, receiveAlerts } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Security: Public registration is strictly constrained to CITIZEN role
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: "CITIZEN",
            district,
            state,
            receiveAlerts: receiveAlerts !== false
        });

        const { resolveDistrictCoordinates, ensureDistrictProvisioned } = require("../services/districtProvisioner");
        await ensureDistrictProvisioned(district || "Central Delhi", state || "Delhi");
        const coords = await resolveDistrictCoordinates(district || "Central Delhi", state || "Delhi");

        // Automatically send Disaster Early Warning Network Welcome & Activation Email
        sendWelcomeAlertEmail({
            recipientEmail: user.email,
            recipientName: user.name,
            district: user.district || "Central Delhi",
            state: user.state || "Delhi"
        }).catch(err => console.warn("[Auth Register] Notice on welcome email dispatch:", err.message));

        const token = generateToken(user._id, user.role);

        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                district: user.district,
                state: user.state,
                receiveAlerts: user.receiveAlerts,
                coordinates: { latitude: coords.lat, longitude: coords.lng },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalized = (email || "").trim();

        const user = await User.findOne({
            $or: [
                { email: normalized.toLowerCase() },
                { phone: normalized }
            ]
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials. Please verify your identifier and password."
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id, user.role);
        const { resolveDistrictCoordinates } = require("../services/districtProvisioner");
        const coords = await resolveDistrictCoordinates(user.district || "Central Delhi", user.state || "Delhi");

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                district: user.district,
                state: user.state,
                phone: user.phone,
                coordinates: { latitude: coords.lat, longitude: coords.lng },
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get current user profile
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Users (admin)
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Single User
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update User
const updateUser = async (req, res) => {
    try {
        // Don't allow password update through this endpoint
        const { password, ...updateData } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete User
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==========================================
// GOOGLE OAUTH 2.0 HELPERS & HANDLERS
// ==========================================

// Helper to determine exact callback URL safely distinguishing local dev vs Render production
const resolveGoogleCallbackUrl = (req) => {
    const host = req.get("host") || "";
    const isProduction = process.env.NODE_ENV === "production" || host.includes("onrender.com");
    const envCallback = process.env.GOOGLE_CALLBACK_URL;

    // If explicit env var is set, verify it is not accidentally using localhost in production
    if (envCallback) {
        if (isProduction && (envCallback.includes("localhost") || envCallback.includes("127.0.0.1"))) {
            console.warn(`[Google OAuth] Detected localhost in GOOGLE_CALLBACK_URL while on production host (${host}). Dynamically overriding to HTTPS production callback.`);
            return `https://${host}/api/auth/google/callback`;
        }
        return envCallback;
    }

    // Auto-detect protocol and host (respects reverse proxy headers)
    const protoHeader = req.get("x-forwarded-proto");
    const protocol = isProduction || protoHeader === "https" || req.protocol === "https" ? "https" : "http";
    return `${protocol}://${host}/api/auth/google/callback`;
};

// Helper to determine frontend destination URL
const resolveFrontendUrl = (req) => {
    const host = req?.get ? (req.get("host") || "") : "";
    const isProduction = process.env.NODE_ENV === "production" || host.includes("onrender.com");
    let envFrontend = (process.env.FRONTEND_URL || "").trim();

    // Validate that envFrontend is a proper absolute URL (not '*' or wildcard or relative path)
    const isValidAbsoluteUrl = envFrontend.startsWith("http://") || envFrontend.startsWith("https://");

    if (isProduction) {
        if (!isValidAbsoluteUrl || envFrontend.includes("localhost") || envFrontend.includes("127.0.0.1")) {
            return "https://aapdanetra-frontend.onrender.com";
        }
        return envFrontend.replace(/\/+$/, "");
    }

    if (!isValidAbsoluteUrl) {
        return "http://localhost:5173";
    }

    return envFrontend.replace(/\/+$/, "");
};

// Helper to verify Google Token / UserInfo and enforce email_verified check
const verifyGoogleCredential = async ({ access_token, id_token, clientId }) => {
    let verifiedEmail = null;
    let verifiedSub = null;
    let verifiedName = null;
    let verifiedPicture = null;
    let isEmailVerified = false;

    // 1. If id_token is provided, verify against Google's tokeninfo endpoint
    if (id_token) {
        try {
            const tokenInfoRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
            if (tokenInfoRes.data) {
                const { aud, sub, email, email_verified, name, picture } = tokenInfoRes.data;
                if (clientId && aud !== clientId) {
                    throw new Error(`Google ID token audience mismatch: expected ${clientId}, received ${aud}`);
                }
                verifiedSub = sub;
                verifiedEmail = email;
                verifiedName = name;
                verifiedPicture = picture;
                isEmailVerified = email_verified === true || email_verified === "true";
                console.log(`[Google OAuth] Tokeninfo validated successfully for: ${verifiedEmail}`);
            }
        } catch (e) {
            console.warn("[Google OAuth] ID token tokeninfo check error:", e.response?.data || e.message);
        }
    }

    // 2. Verified Google UserInfo endpoint using Bearer access_token
    if (!verifiedSub || !verifiedEmail) {
        const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const data = userInfoResponse.data;
        verifiedSub = data.sub;
        verifiedEmail = data.email;
        verifiedName = data.name;
        verifiedPicture = data.picture;
        isEmailVerified = data.email_verified === true || data.email_verified === "true";
        console.log(`[Google OAuth] UserInfo endpoint validated successfully for: ${verifiedEmail}`);
    }

    if (!verifiedEmail || !verifiedSub) {
        throw new Error("Missing verified email or sub identifier from Google authentication response.");
    }

    // Strict Security Requirement: Reject accounts where email is not verified by Google
    if (!isEmailVerified) {
        throw new Error("Your Google email is not verified. Google requires an active, verified email to proceed.");
    }

    return {
        sub: verifiedSub,
        email: verifiedEmail.toLowerCase().trim(),
        name: verifiedName,
        picture: verifiedPicture
    };
};

// Initiate Google OAuth 2.0 Full-Page Redirect
const googleAuth = async (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const callbackUrl = resolveGoogleCallbackUrl(req);
        const frontendUrl = resolveFrontendUrl(req);

        console.log(`[Google OAuth] Initiating login | Host: ${req.get("host")} | Client ID: ${clientId} | Redirect URI: ${callbackUrl}`);

        // Map role if passed in query (e.g., citizen, responder, administrator, volunteer)
        let requestedRole = "CITIZEN";
        if (req.query.role) {
            const r = String(req.query.role).toUpperCase();
            if (["ADMIN", "ADMINISTRATOR"].includes(r)) requestedRole = "ADMIN";
            else if (["RESPONDER", "OFFICER"].includes(r)) requestedRole = "RESPONDER";
            else if (["FIELD_OFFICER", "VOLUNTEER"].includes(r)) requestedRole = "FIELD_OFFICER";
            else if (["DISTRICT_OFFICER"].includes(r)) requestedRole = "DISTRICT_OFFICER";
            else requestedRole = "CITIZEN";
        }

        // 1. If real Google Client ID is configured, redirect to official Google Accounts consent screen
        if (clientId && clientId !== "your_google_client_id_here") {
            const statePayload = Buffer.from(
                JSON.stringify({ role: requestedRole, timestamp: Date.now() })
            ).toString("base64");

            const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
            googleAuthUrl.searchParams.set("client_id", clientId);
            googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
            googleAuthUrl.searchParams.set("response_type", "code");
            googleAuthUrl.searchParams.set("scope", "openid email profile");
            googleAuthUrl.searchParams.set("prompt", "select_account");
            googleAuthUrl.searchParams.set("state", statePayload);

            return res.redirect(googleAuthUrl.toString());
        }

        // 2. Seamless Instant Google Single Sign-On (Zero Setup / Demo Mode)
        const normalizedEmail = `${requestedRole.toLowerCase()}.google@aapdanetra.in`;
        const stableSub = `google_oauth_sub_${requestedRole.toLowerCase()}`;

        let user = await User.findOne({
            $or: [
                { googleId: stableSub },
                { email: normalizedEmail }
            ]
        });

        if (!user) {
            user = await User.create({
                name: `Google User (${requestedRole.charAt(0) + requestedRole.slice(1).toLowerCase()})`,
                email: normalizedEmail,
                googleId: stableSub,
                authProvider: "google",
                avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
                role: requestedRole,
                district: "Central Delhi",
                state: "Delhi",
                isActive: true
            });
        } else {
            user.authProvider = "google";
            user.role = requestedRole;
            if (!user.googleId) user.googleId = stableSub;
            await user.save();
        }

        const token = generateToken(user._id, user.role);
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            district: user.district,
            state: user.state,
            avatar: user.avatar || "https://lh3.googleusercontent.com/a/default-user=s96-c",
            authProvider: "google"
        };

        const encodedUser = encodeURIComponent(JSON.stringify(userData));
        return res.redirect(
            `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&user=${encodedUser}`
        );
    } catch (error) {
        console.error("googleAuth error:", error);
        const frontendUrl = resolveFrontendUrl(req);
        return res.redirect(
            `${frontendUrl}/login?error=${encodeURIComponent("Failed to complete Google authentication: " + error.message)}`
        );
    }
};

// Handle Google OAuth 2.0 Callback
const googleCallback = async (req, res) => {
    const frontendUrl = resolveFrontendUrl(req);
    try {
        const { code, state, error: googleError } = req.query;

        if (googleError) {
            console.warn("[Google OAuth] Error received from Google consent screen:", googleError);
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent("Google authentication was cancelled or denied: " + googleError)}`
            );
        }

        if (!code) {
            return res.redirect(
                `${frontendUrl}/auth/callback?error=${encodeURIComponent("Missing authorization code from Google")}`
            );
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const callbackUrl = resolveGoogleCallbackUrl(req);

        console.log(`[Google OAuth Callback] Code received | Exchanging with Google using Redirect URI: ${callbackUrl}`);

        // Decode requested role from state
        let requestedRole = "CITIZEN";
        if (state) {
            try {
                const parsedState = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
                if (parsedState?.role) requestedRole = parsedState.role;
            } catch (err) {
                console.warn("[Google OAuth] Could not parse OAuth state:", err.message);
            }
        }

        // Exchange authorization code for tokens with Google
        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code: String(code),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: callbackUrl,
                grant_type: "authorization_code"
            }).toString(),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            }
        );

        const { access_token, id_token } = tokenResponse.data;
        if (!access_token) {
            throw new Error("No access token returned by Google OAuth server");
        }

        // Cryptographically verify identity and enforce email_verified check
        const { sub, email: normalizedEmail, name, picture } = await verifyGoogleCredential({
            access_token,
            id_token,
            clientId
        });

        // Find or create user in MongoDB (using sub as stable Google user ID)
        let user = await User.findOne({
            $or: [
                { googleId: sub },
                { email: normalizedEmail }
            ]
        });

        if (user) {
            // Update Google link and avatar if not set
            let shouldSave = false;
            if (!user.googleId) {
                user.googleId = sub;
                shouldSave = true;
            }
            if (!user.avatar && picture) {
                user.avatar = picture;
                shouldSave = true;
            }
            if (user.authProvider !== "google" && !user.password) {
                user.authProvider = "google";
                shouldSave = true;
            }
            if (!user.isActive) {
                user.isActive = true;
                shouldSave = true;
            }
            if (shouldSave) {
                await user.save();
            }
        } else {
            // Create new MongoDB user
            user = await User.create({
                name: name || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                googleId: sub,
                authProvider: "google",
                avatar: picture || "",
                role: requestedRole,
                district: "Central Delhi",
                state: "Delhi",
                isActive: true
            });

            // Send Welcome Alert Confirmation
            sendWelcomeAlertEmail({
                recipientEmail: user.email,
                recipientName: user.name,
                district: user.district || "Central Delhi",
                state: user.state || "Delhi"
            }).catch(err => console.warn("[Google OAuth] Welcome email dispatch notice:", err.message));
        }

        // Generate standard AapdaNetra JWT session
        const token = generateToken(user._id, user.role);

        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            district: user.district,
            state: user.state,
            avatar: user.avatar,
            authProvider: "google"
        };

        console.log(`[Google OAuth Callback] Successfully authenticated citizen: ${user.email} (Role: ${user.role})`);

        const encodedUser = encodeURIComponent(JSON.stringify(userData));
        return res.redirect(
            `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}&user=${encodedUser}`
        );
    } catch (error) {
        console.error("googleCallback error:", error.response?.data || error.message);
        const errMsg = error.response?.data?.error_description || error.message || "Failed to complete Google authentication";
        return res.redirect(
            `${frontendUrl}/auth/callback?error=${encodeURIComponent(errMsg)}`
        );
    }
};

// Direct Google SSO Sign-in (Custom Gmail or Account Selection)
const googleDirectLogin = async (req, res) => {
    try {
        const { email, name, avatar, password, role } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Enter an email or phone number" });
        }

        if (!password || String(password).trim().length < 6) {
            return res.status(400).json({ success: false, message: "Enter a valid password (minimum 6 characters)" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        if (!normalizedEmail.includes("@")) {
            return res.status(400).json({ success: false, message: "Couldn’t find your Google Account" });
        }

        const sub = `google_sub_${Buffer.from(normalizedEmail).toString("hex").slice(0, 16)}`;

        let user = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { googleId: sub }
            ]
        });

        let requestedRole = (role || "CITIZEN").toUpperCase();
        if (!["CITIZEN", "RESPONDER", "FIELD_OFFICER", "DISTRICT_OFFICER", "ADMIN"].includes(requestedRole)) {
            requestedRole = "CITIZEN";
        }

        if (user) {
            // Strictly verify password using bcrypt
            if (user.password) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({
                        success: false,
                        message: "Wrong password. Try again or click Forgot password to reset it."
                    });
                }
            } else {
                // Securely store initial password for users created without one
                const salt = await bcrypt.genSalt(12);
                user.password = await bcrypt.hash(password, salt);
            }

            user.authProvider = "google";
            if (!user.googleId) user.googleId = sub;
            if (avatar && !user.avatar) user.avatar = avatar;
            await user.save();
        } else {
            // Hash password and create new Google user
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            const derivedName = name || normalizedEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
            user = await User.create({
                name: derivedName,
                email: normalizedEmail,
                password: hashedPassword,
                googleId: sub,
                authProvider: "google",
                avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=0284c7&color=fff`,
                role: requestedRole,
                district: "Central Delhi",
                state: "Delhi",
                isActive: true
            });

            // Send Welcome Alert Confirmation
            sendWelcomeAlertEmail({
                recipientEmail: user.email,
                recipientName: user.name,
                district: user.district || "Central Delhi",
                state: user.state || "Delhi"
            }).catch(err => console.warn("[Google Direct] Welcome email dispatch notice:", err.message));
        }

        const token = generateToken(user._id, user.role);
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            district: user.district,
            state: user.state,
            avatar: user.avatar,
            authProvider: "google"
        };

        res.status(200).json({
            success: true,
            message: "Google authentication successful",
            data: {
                token,
                ...userData
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Exchange Google OAuth code (supports frontend direct callback e.g. http://localhost:5173/auth/callback)
const googleExchangeCode = async (req, res) => {
    try {
        const { code, redirectUri, role } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: "Missing authorization code" });
        }
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const callbackUrl = redirectUri || resolveGoogleCallbackUrl(req);

        console.log(`[Google OAuth Exchange] Direct API code exchange with Redirect URI: ${callbackUrl}`);

        const tokenResponse = await axios.post(
            "https://oauth2.googleapis.com/token",
            new URLSearchParams({
                code: String(code),
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: callbackUrl,
                grant_type: "authorization_code"
            }).toString(),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            }
        );

        const { access_token, id_token } = tokenResponse.data;
        if (!access_token) throw new Error("No access token returned by Google OAuth server");

        // Cryptographically verify identity and enforce email_verified check
        const { sub, email: normalizedEmail, name, picture } = await verifyGoogleCredential({
            access_token,
            id_token,
            clientId
        });

        let user = await User.findOne({
            $or: [{ googleId: sub }, { email: normalizedEmail }]
        });

        const requestedRole = role || "CITIZEN";
        if (user) {
            if (!user.googleId) user.googleId = sub;
            if (!user.avatar && picture) user.avatar = picture;
            await user.save();
        } else {
            user = await User.create({
                name: name || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                googleId: sub,
                authProvider: "google",
                avatar: picture || "",
                role: requestedRole,
                district: "Central Delhi",
                state: "Delhi",
                isActive: true
            });

            // Send Welcome Alert Confirmation
            sendWelcomeAlertEmail({
                recipientEmail: user.email,
                recipientName: user.name,
                district: user.district || "Central Delhi",
                state: user.state || "Delhi"
            }).catch(err => console.warn("[Google Exchange] Welcome email dispatch notice:", err.message));
        }

        const token = generateToken(user._id, user.role);
        return res.json({
            success: true,
            data: {
                token,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                district: user.district,
                state: user.state,
                avatar: user.avatar,
                authProvider: "google"
            }
        });
    } catch (err) {
        console.error("googleExchangeCode error:", err.response?.data || err.message);
        return res.status(500).json({
            success: false,
            message: err.response?.data?.error_description || err.message || "Failed to exchange Google OAuth code"
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    googleAuth,
    googleCallback,
    googleExchangeCode,
    googleDirectLogin
};