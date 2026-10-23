import { Request, Response } from 'express';
import { getAdminSupabase } from '../db/supabase.js';

export class AuthController {
  /**
   * POST /api/auth/register
   * Registers a new user with auto-confirmation so they can sign in immediately
   * without waiting for email verification.
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, phone, termsAccepted } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const admin = getAdminSupabase();

      // Check if user already exists
      const { data: userList } = await admin.auth.admin.listUsers();
      const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        // Auto-confirm existing unconfirmed user and update password
        const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || existingUser.user_metadata?.full_name || 'Traveler',
            phone: phone || existingUser.user_metadata?.phone || null,
            terms_accepted: termsAccepted ?? true
          }
        });
        if (updateErr) {
          res.status(400).json({ error: updateErr.message });
          return;
        }
      } else {
        // Create new user with email_confirm: true
        const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || 'Traveler',
            phone: phone || null,
            terms_accepted: termsAccepted ?? true
          }
        });

        if (createErr || !newUser?.user) {
          res.status(400).json({ error: createErr?.message || 'Failed to create user.' });
          return;
        }

        userId = newUser.user.id;
      }

      // Upsert profile row into public.profiles
      const profileData: Record<string, any> = {
        id: userId,
        email: cleanEmail,
        full_name: fullName || 'Traveler',
        preferred_currency: 'INR',
        terms_accepted: termsAccepted ?? true,
        terms_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (phone) {
        profileData.phone = phone;
        profileData.mobile_number = phone;
      }

      const { data: savedProfile, error: profileErr } = await (admin.from('profiles') as any)
        .upsert(profileData)
        .select('*')
        .single();

      if (profileErr) {
        console.warn('Profile upsert warning:', profileErr.message);
      }

      res.status(200).json({
        success: true,
        user: {
          id: userId,
          email: cleanEmail,
          fullName: fullName || 'Traveler',
          phone: phone || null
        },
        profile: savedProfile || profileData
      });
    } catch (err: any) {
      console.error('AuthController.register error:', err);
      res.status(500).json({ error: err.message || 'Internal server error.' });
    }
  }

  /**
   * POST /api/auth/confirm-user
   * Auto-confirms an existing user's email if they were created with email_confirm: false
   */
  static async confirmUser(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email is required.' });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const admin = getAdminSupabase();

      const { data: userList } = await admin.auth.admin.listUsers();
      const user = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      // Confirm email
      await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true
      });

      // Ensure profile exists
      const { data: prof } = await (admin.from('profiles') as any).select('id').eq('id', user.id).single();
      if (!prof) {
        await (admin.from('profiles') as any).upsert({
          id: user.id,
          email: cleanEmail,
          full_name: user.user_metadata?.full_name || 'Traveler',
          phone: user.user_metadata?.phone || null,
          mobile_number: user.user_metadata?.phone || null,
          preferred_currency: 'INR',
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        });
      }

      res.status(200).json({ success: true, message: 'User confirmed successfully.' });
    } catch (err: any) {
      console.error('AuthController.confirmUser error:', err);
      res.status(500).json({ error: err.message || 'Failed to confirm user.' });
    }
  }

  /**
   * POST /api/auth/lookup-identifier
   * Looks up the user's email if they provided a phone number to sign in
   */
  static async lookupIdentifier(req: Request, res: Response): Promise<void> {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        res.status(400).json({ error: 'Identifier is required.' });
        return;
      }

      const clean = identifier.trim();
      const admin = getAdminSupabase();

      // If it looks like a phone number
      const digits = clean.replace(/\D/g, '');
      if (digits.length >= 10) {
        const phoneVariants = [
          clean,
          `+${digits}`,
          digits.length === 10 ? `+91${digits}` : null
        ].filter(Boolean) as string[];

        for (const p of phoneVariants) {
          const { data } = await (admin.from('profiles') as any).select('email').eq('phone', p).limit(1);
          if (data && data.length > 0 && data[0]?.email) {
            res.status(200).json({ email: data[0].email });
            return;
          }
        }
      }

      // Return the identifier as is if not matched
      res.status(200).json({ email: clean });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
