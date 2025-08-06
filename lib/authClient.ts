import {
  createAuthClient
} from "better-auth/react";
import { oidcClient, adminClient, inferAdditionalFields } from "better-auth/client/plugins"
import { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [oidcClient(), adminClient(), inferAdditionalFields<typeof auth>()]
})

export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient;