import {
  createAuthClient
} from "better-auth/react";
import { oidcClient, adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [oidcClient(), adminClient()]
})

export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient;