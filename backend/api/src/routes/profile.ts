import { Router, Response } from "express";
import { AuthedRequest, verifyFirebaseAuth } from "../middleware/auth";
import { getSupabaseClient } from "../services/supabaseClient";
import { adminAuth } from "../config/firebase";

const profileRouter = Router();

/**
 * @openapi
 * /profile:
 *   get:
 *     summary: Fetch the authenticated user's profile entry.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                   nullable: true
 *       '401':
 *         description: Missing or invalid Firebase ID token.
 */
profileRouter.get(
  "/",
  verifyFirebaseAuth,
  async (req: AuthedRequest, res: Response) => {
    const supabase = getSupabaseClient();
    const userId = req.user?.uid;

    if (!userId) {
      res.status(400).json({ error: "User ID missing in token." });
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ profile: data });
  },
);

/**
 * @openapi
 * /profile/change-password:
 *   post:
 *     summary: Change the authenticated user's password.
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password updated successfully.
 *       '400':
 *         description: Invalid request.
 *       '401':
 *         description: Unauthorized.
 */
profileRouter.post(
  "/change-password",
  verifyFirebaseAuth,
  async (req: AuthedRequest, res: Response) => {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(400).json({ error: "User ID missing in token." });
      return;
    }

    const { newPassword } = req.body ?? {};

    if (!newPassword || typeof newPassword !== "string") {
      res.status(400).json({ error: "newPassword is required." });
      return;
    }

    if (newPassword.length < 8) {
      res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
      return;
    }

    try {
      await adminAuth.updateUser(uid, { password: newPassword });
      res.json({ message: "Password updated successfully." });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Password change error:", error);
      res
        .status(500)
        .json({ error: "Failed to update password. Please try again." });
    }
  },
);

export default profileRouter;
