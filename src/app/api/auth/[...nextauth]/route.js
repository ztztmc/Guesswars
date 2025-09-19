import NextAuth from "next-auth/next";
import DiscordProvider from "next-auth/providers/discord";

export const AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
  },
};

const handler = NextAuth(AuthOptions);

export { handler as GET, handler as POST };
