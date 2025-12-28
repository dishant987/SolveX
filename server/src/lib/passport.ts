import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../lib/prisma.js';
import type { GoogleProfile } from '../types/type.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL!;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleProfile: GoogleProfile = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          given_name: profile.name?.givenName,
          family_name: profile.name?.familyName,
          picture: profile.photos?.[0]?.value,
        };

        if (!googleProfile.email) {
          return done(new Error('No email found in Google profile'), undefined);
        }

        // Check if account already exists
        const existingAccount = await prisma.authAccount.findUnique({
          where: {
            provider_providerId: {
              provider: 'GOOGLE',
              providerId: googleProfile.id,
            },
          },
          include: {
            user: true,
          },
        });

        if (existingAccount) {
          return done(null, existingAccount.user);
        }

        // Check if user exists with same email
        const existingUser = await prisma.user.findUnique({
          where: { email: googleProfile.email },
        });

        if (existingUser) {
          // Link Google account to existing user
          await prisma.authAccount.create({
            data: {
              provider: 'GOOGLE',
              providerId: googleProfile.id,
              userId: existingUser.id,
            },
          });
          return done(null, existingUser);
        }

        // Create new user with Google account
        const newUser = await prisma.user.create({
          data: {
            email: googleProfile.email,
            firstName: googleProfile.given_name || '',
            lastName: googleProfile.family_name || '',
            imageUrl: googleProfile.picture,
            accounts: {
              create: {
                provider: 'GOOGLE',
                providerId: googleProfile.id,
              },
            },
          },
        });

        return done(null, newUser);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;