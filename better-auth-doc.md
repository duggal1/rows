---
title: Google
description: Google provider setup and usage.
---

<Steps>
  <Step>
    ### Get your Google credentials

    To use Google as a social provider, you need to get your Google credentials. You can get them by creating a new project in the [Google Cloud Console](https://console.cloud.google.com/apis/dashboard).

    In the Google Cloud Console > Credentials > Authorized redirect URIs, make sure to set the redirect URL to `http://localhost:3000/api/auth/callback/google` for local development. For production, make sure to set the redirect URL as your application domain, e.g. `https://example.com/api/auth/callback/google`. If you change the base path of the auth routes, you should update the redirect URL accordingly.

    <Callout type="info">
      **Creating Your Google OAuth Credentials**

      If you haven't created OAuth credentials yet, follow these step-by-step instructions:

      1. Open **Google Cloud Console** → **APIs & Services** → **Credentials**
      2. Click **Create Credentials** → **OAuth client ID**
      3. Choose **Web application**
      4. Add your redirect URIs:
         * `http://localhost:3000/api/auth/callback/google` (for local development)
         * `https://your-domain.com/api/auth/callback/google` (for production)
      5. Copy the **Client ID** and **Client Secret** into your environment variables

      These steps avoid common issues such as `redirect_uri_mismatch`.
    </Callout>
  </Step>

  <Step>
    ### Configure the provider

    To configure the provider, you need to pass the `clientId` and `clientSecret` to `socialProviders.google` in your auth configuration.

    ```ts title="auth.ts"
    import { betterAuth } from "better-auth"

    export const auth = betterAuth({
        baseURL: process.env.BETTER_AUTH_URL, // [!code highlight]
        socialProviders: {
            google: { // [!code highlight]
                clientId: process.env.GOOGLE_CLIENT_ID as string, // [!code highlight]
                clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, // [!code highlight]
            }, // [!code highlight]
        },
    })
    ```

    <Callout type="warn">
      **Important: Set Your Base URL**

      You must configure the `baseURL` to avoid `redirect_uri_mismatch` errors. Better Auth uses this to construct the OAuth callback URL sent to Google.

      **Option 1: Environment Variable (Recommended)**

      Add to your `.env` file:

      ```dotenv
      BETTER_AUTH_URL=https://your-domain.com
      ```

      **Option 2: Explicit Configuration**

      Pass `baseURL` directly in the auth config as shown above.
      Without this, the callback URL may default to `localhost`, causing Google OAuth to fail in production.
    </Callout>
  </Step>
</Steps>

## Usage

### Sign In with Google

To sign in with Google, you can use the `signIn.social` function provided by the client. The `signIn` function takes an object with the following properties:

* `provider`: The provider to use. It should be set to `google`.

```ts title="auth-client.ts"  /
import { createAuthClient } from "better-auth/client";
const authClient = createAuthClient();

const signIn = async () => {
  const data = await authClient.signIn.social({
    provider: "google",
  });
};
```

### Sign In with Google With ID Token

To sign in with Google using the ID Token, you can use the `signIn.social` function to pass the ID Token.

This is useful when you have the ID Token from Google on the client-side and want to use it to sign in on the server.

<Callout>
  If ID token is provided no redirection will happen, and the user will be
  signed in directly.
</Callout>

```ts title="auth-client.ts"
const data = await authClient.signIn.social({
    provider: "google",
    idToken: {
        token: // Google ID Token,
        accessToken: // Google Access Token
    }
})
```

<Callout>
  If you want to use google one tap, you can use the [One Tap
  Plugin](/docs/plugins/one-tap) guide.
</Callout>

### Cross-Platform Sign In (Web, iOS, Android)

Google issues a separate Client ID per platform in the same Google Cloud project. Pass an array to `clientId` to accept ID tokens from any of them. See [clientId](/docs/concepts/oauth#clientid) for the shared provider-option semantics.

```ts title="auth.ts"
socialProviders: {
    google: {
        clientId: [ // [!code highlight]
            process.env.GOOGLE_WEB_CLIENT_ID as string, // [!code highlight]
            process.env.GOOGLE_IOS_CLIENT_ID as string, // [!code highlight]
            process.env.GOOGLE_ANDROID_CLIENT_ID as string, // [!code highlight]
        ], // [!code highlight]
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
}
```

Your mobile app signs in with the native Google SDK and forwards the ID token:

```ts title="Mobile app"
const { idToken, accessToken } = await GoogleSignin.signIn();

await authClient.signIn.social({
    provider: "google",
    idToken: { token: idToken, accessToken },
});
```

<Callout type="info">
  The array only expands ID token audience verification. The authorization code flow still uses the first entry paired with the single `clientSecret` and `redirectURI`, so those cannot vary per platform within one provider block.
</Callout>

### Restrict Sign-In to Google Workspace

Set `hd` on the Google provider to require a verified Google Workspace hosted-domain claim. Google also receives this value as an account-selection hint, but Better Auth enforces the returned ID token/profile claim after Google signs the response.

```ts title="auth.ts"
socialProviders: {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        hd: "company.com", // [!code highlight]
    },
}
```

Set `hd: "*"` to allow any Google Workspace hosted domain. Tokens with no `hd` claim are rejected whenever `hd` is configured.

<Callout type="warn">
  A custom `getUserInfo` callback replaces Google's built-in callback-path `hd`
  check. Validate the claim from a trusted provider response and return `null`
  when it is missing or does not match. Direct ID-token sign-in follows the
  provider's ID-token verification path, while Google One Tap enforces the
  configured `hd` separately.
</Callout>

### Always ask to select an account

If you want to always ask the user to select an account, you pass the `prompt` parameter to the provider, setting it to `select_account`.

```ts
socialProviders: {
    google: {
        prompt: "select_account", // [!code highlight]
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
}
```

### Requesting Additional Google Scopes

If your application needs additional Google scopes after the user has already signed up (e.g., for Google Drive, Gmail, or other Google services), you can request them using the `linkSocial` method with the same Google provider.

```tsx title="auth-client.ts"
const requestGoogleDriveAccess = async () => {
  await authClient.linkSocial({
    provider: "google",
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
};

// Example usage in a React component
return (
  <button onClick={requestGoogleDriveAccess}>
    Add Google Drive Permissions
  </button>
);
```

This will trigger a new OAuth flow that requests the additional scopes. After completion, your account will have the new scope in the database, and the access token will give you access to the requested Google APIs.

<Callout>
  Ensure you're using Better Auth version 1.2.7 or later to avoid "Social
  account already linked" errors when requesting additional scopes from the same
  provider.
</Callout>

### Always get refresh token

Google only issues a refresh token the first time a user consents to your app.
If the user has already authorized your app, subsequent OAuth flows will only return an access token, not a refresh token.

To always get a refresh token, you can set the `accessType` to `offline`, and `prompt` to `select_account consent` in the provider options.

```ts
socialProviders: {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        accessType: "offline", // [!code highlight]
        prompt: "select_account consent", // [!code highlight]
    },
}
```

<Callout>
  **Revoking Access:** If you want to get a new refresh token for a user who has
  already authorized your app, you must have them revoke your app's access in
  their Google account settings, then re-authorize.
</Callout>
---
title: API
description: Learn how to call Better Auth API endpoints on the server, pass body, headers, and query parameters, retrieve response headers, and handle errors.
---

When you create a new Better Auth instance, it provides you with an `api` object. This object exposes every endpoint that exists in your Better Auth instance. And you can use this to interact with Better Auth server side.

Any endpoint added to Better Auth, whether from plugins or the core, will be accessible through the `api` object.

## Calling API Endpoints on the Server

To call an API endpoint on the server, import your `auth` instance and call the endpoint using the `api` object.

```ts title="server.ts"
import { betterAuth } from "better-auth";
import { headers } from "next/headers";

export const auth = betterAuth({
    //...
})

// calling get session on the server
await auth.api.getSession({
    headers: await headers() // some endpoints might require headers
})
```

### Body, Headers, Query

Unlike the client, the server needs the values to be passed as an object with the key `body` for the body, `headers` for the headers, and `query` for query parameters.

```ts title="server.ts"
import { auth } from "@/lib/auth"

await auth.api.getSession({
    headers: await headers() // headers containing the user's session token
})

await auth.api.signInEmail({
    body: {
        email: "john@doe.com",
        password: "password"
    },
    headers: await headers() // optional but would be useful to get the user IP, user agent, etc.
})

await auth.api.verifyEmail({
    query: {
        token: "my_token"
    }
})
```

<Callout>
  Better Auth API endpoints are built on top of [better-call](https://github.com/bekacru/better-call), a tiny web framework that lets you call REST API endpoints as if they were regular functions and allows us to easily infer client types from the server.
</Callout>

### Getting `headers` and `Response` Object

When you invoke an API endpoint on the server, it will return a standard JavaScript object or array directly as it's just a regular function call.

But there are times when you might want to get the `headers` or the `Response` object instead. For example, if you need to get the cookies or the headers.

#### Getting `headers`

To get the `headers`, you can pass the `returnHeaders` option to the endpoint.

```ts title="server.ts"
import { auth } from "@/lib/auth"

const { headers, response } = await auth.api.signUpEmail({
	returnHeaders: true,
	body: {
		email: "john@doe.com",
		password: "password",
		name: "John Doe",
	},
});
```

The `headers` will be a `Headers` object, which you can use to get the cookies or the headers.

```ts
const cookies = headers.getSetCookie();
const customHeader = headers.get("x-custom-header");
```

#### Getting `Response` Object

To get the `Response` object, you can pass the `asResponse` option to the endpoint.

```ts title="server.ts"
import { auth } from "@/lib/auth"

const response = await auth.api.signInEmail({
    body: {
        email: "",
        password: ""
    },
    asResponse: true
})
```

### Error Handling

When you call an API endpoint on the server, it will throw an error if the request fails. You can catch the error and handle it as you see fit. The error instance is an instance of `APIError`.

```ts title="server.ts"
import { auth } from "@/lib/auth"
import { APIError, isAPIError } from "better-auth/api";

try {
    await auth.api.signInEmail({
        body: {
            email: "",
            password: ""
        }
    })
} catch (error) {
    if (isAPIError(error)) {
        console.log(error.message, error.status)
    }
}
```
---
title: API
description: Learn how to call Better Auth API endpoints on the server, pass body, headers, and query parameters, retrieve response headers, and handle errors.
---

When you create a new Better Auth instance, it provides you with an `api` object. This object exposes every endpoint that exists in your Better Auth instance. And you can use this to interact with Better Auth server side.

Any endpoint added to Better Auth, whether from plugins or the core, will be accessible through the `api` object.

## Calling API Endpoints on the Server

To call an API endpoint on the server, import your `auth` instance and call the endpoint using the `api` object.

```ts title="server.ts"
import { betterAuth } from "better-auth";
import { headers } from "next/headers";

export const auth = betterAuth({
    //...
})

// calling get session on the server
await auth.api.getSession({
    headers: await headers() // some endpoints might require headers
})
```

### Body, Headers, Query

Unlike the client, the server needs the values to be passed as an object with the key `body` for the body, `headers` for the headers, and `query` for query parameters.

```ts title="server.ts"
import { auth } from "@/lib/auth"

await auth.api.getSession({
    headers: await headers() // headers containing the user's session token
})

await auth.api.signInEmail({
    body: {
        email: "john@doe.com",
        password: "password"
    },
    headers: await headers() // optional but would be useful to get the user IP, user agent, etc.
})

await auth.api.verifyEmail({
    query: {
        token: "my_token"
    }
})
```

<Callout>
  Better Auth API endpoints are built on top of [better-call](https://github.com/bekacru/better-call), a tiny web framework that lets you call REST API endpoints as if they were regular functions and allows us to easily infer client types from the server.
</Callout>

### Getting `headers` and `Response` Object

When you invoke an API endpoint on the server, it will return a standard JavaScript object or array directly as it's just a regular function call.

But there are times when you might want to get the `headers` or the `Response` object instead. For example, if you need to get the cookies or the headers.

#### Getting `headers`

To get the `headers`, you can pass the `returnHeaders` option to the endpoint.

```ts title="server.ts"
import { auth } from "@/lib/auth"

const { headers, response } = await auth.api.signUpEmail({
	returnHeaders: true,
	body: {
		email: "john@doe.com",
		password: "password",
		name: "John Doe",
	},
});
```

The `headers` will be a `Headers` object, which you can use to get the cookies or the headers.

```ts
const cookies = headers.getSetCookie();
const customHeader = headers.get("x-custom-header");
```

#### Getting `Response` Object

To get the `Response` object, you can pass the `asResponse` option to the endpoint.

```ts title="server.ts"
import { auth } from "@/lib/auth"

const response = await auth.api.signInEmail({
    body: {
        email: "",
        password: ""
    },
    asResponse: true
})
```

### Error Handling

When you call an API endpoint on the server, it will throw an error if the request fails. You can catch the error and handle it as you see fit. The error instance is an instance of `APIError`.

```ts title="server.ts"
import { auth } from "@/lib/auth"
import { APIError, isAPIError } from "better-auth/api";

try {
    await auth.api.signInEmail({
        body: {
            email: "",
            password: ""
        }
    })
} catch (error) {
    if (isAPIError(error)) {
        console.log(error.message, error.status)
    }
}
```
---
title: OAuth
description: Learn how to configure social OAuth providers, sign in and link accounts, request scopes, pass additional data, refresh access tokens, map profiles, and customize provider options.
---

Better Auth comes with built-in support for OAuth 2.0 and OpenID Connect. This allows you to authenticate users via popular OAuth providers like Google, Facebook, GitHub, and more.

If your desired provider isn't directly supported, you can use the [Generic OAuth Plugin](/docs/plugins/generic-oauth) for custom integrations.

## Configuring Social Providers

To enable a social provider, you need to provide `clientId` and `clientSecret` for the provider.

Here's an example of how to configure Google as a provider:

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
    },
  },
});
```

## Usage

### Sign In

To sign in with a social provider, you can use the `signIn.social` function with the `authClient` or `auth.api` for server-side usage.

```ts
// client-side usage
await authClient.signIn.social({
  provider: "google", // or any other provider id
})
```

```ts
// server-side usage
await auth.api.signInSocial({
  body: {
    provider: "google", // or any other provider id
  },
});
```

### Link account

To link an account to a social provider, you can use the `linkAccount` function with the `authClient` or `auth.api` for server-side usage.

```ts
await authClient.linkSocial({
  provider: "google", // or any other provider id
})
```

server-side usage:

```ts
await auth.api.linkSocialAccount({
  body: {
    provider: "google", // or any other provider id
  },
  headers: await headers() // headers containing the user's session token
});
```

### Get Access Token

To get the access token for a social provider, you can use the `getAccessToken` function with the `authClient` or `auth.api` for server-side usage. When you use this endpoint, if the access token is expired, it will be refreshed.

```ts
const { accessToken } = await authClient.getAccessToken({
  providerId: "google", // or any other provider id
  accountId: "accountId", // optional, if you want to get the access token for a specific account
})
```

server-side usage:

```ts
await auth.api.getAccessToken({
  body: {
    providerId: "google", // or any other provider id
    accountId: "accountId", // optional, if you want to get the access token for a specific account
    userId: "userId", // optional, if you don't provide headers with authenticated token
  },
  headers: await headers() // headers containing the user's session token
});
```

### Get Account Info Provided by the provider

To get provider specific account info you can use the `accountInfo` function with the `authClient` or `auth.api` for server-side usage.

```ts
const info = await authClient.accountInfo({
  query: { accountId: "accountId" }, // here you pass in the provider given account id, the provider is automatically detected from the account id
})
```

server-side usage:

```ts
await auth.api.accountInfo({
  query: {
    accountId: "accountId",
    userId: "userId", // optional, if you don't provide headers with authenticated token
  },
  headers: await headers() // headers containing the user's session token
});
```

### Requesting Additional Scopes

Sometimes your application may need additional OAuth scopes after the user has already signed up (e.g., for accessing GitHub repositories or Google Drive). Users may not want to grant extensive permissions initially, preferring to start with minimal permissions and grant additional access as needed.

You can request additional scopes by using the `linkSocial` method with the same provider. This will trigger a new OAuth flow that requests the additional scopes while maintaining the existing account connection.

```ts
const requestAdditionalScopes = async () => {
    await authClient.linkSocial({
        provider: "google",
        scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
};
```

<Callout>
  Make sure you're running Better Auth version 1.2.7 or later. Earlier versions (like 1.2.2) may show a "Social account already linked" error when trying to link with an existing provider for additional scopes.
</Callout>

### Passing Additional Data Through OAuth Flow

Better Auth allows you to pass additional data through the OAuth flow without storing it in the database. This is useful for scenarios like tracking referral codes, analytics sources, or other temporary data that should be processed during authentication but not persisted.

When initiating OAuth sign-in or account linking, pass the additional data:

```ts
// Client-side: Sign in with additional data
await authClient.signIn.social({
  provider: "google",
  additionalData: {
    referralCode: "ABC123",
    source: "landing-page",
  },
});

// Client-side: Link account with additional data
await authClient.linkSocial({
  provider: "google",
  additionalData: {
    referralCode: "ABC123",
  },
});

// Server-side: Sign in with additional data
await auth.api.signInSocial({
  body: {
    provider: "google",
    additionalData: {
      referralCode: "ABC123",
      source: "admin-panel",
    },
  },
});
```

#### Accessing Additional Data in Hooks

The additional data is available in your hooks during the OAuth callback through the `getOAuthState`.

<Callout>
  This usually works for `/callback/:id` paths and the generic OAuth plugin callback path (`/oauth2/callback/:providerId`).
</Callout>

Example using an after hook:

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { getOAuthState } from "better-auth/api";

export const auth = betterAuth({
  // Other configurations...
  hooks: {
    after: [
      {
        matcher: () => true,
        handler: async (ctx) => {
          // Additional data is only available during OAuth callback
          if (ctx.path === "/callback/:id") {
            const additionalData = await getOAuthState<{
              referralCode?: string;
              source?: string;
            }>();

            if (additionalData) {
              // IMPORTANT: Validate and sanitize the data before using it
              // This data comes from the client and should not be trusted

              // Example: Validate and process referral code
              if (additionalData.referralCode) {
                const isValidFormat = /^[A-Z0-9]{6}$/.test(additionalData.referralCode);
                if (isValidFormat) {
                  // Verify the referral code exists in your database
                  const referral = await db.referrals.findByCode(additionalData.referralCode);
                  if (referral) {
                    // Safe to use the verified referral
                    await db.referrals.incrementUsage(referral.id);
                  }
                }
              }

              // Track analytics (low-risk usage)
              if (additionalData.source) {
                await analytics.track("oauth_signin", {
                  source: additionalData.source,
                  userId: ctx.context.session?.user.id,
                });
              }
            }
          }
        },
      },
    ],
  },
});
```

Example using a database hook:

```ts title="auth.ts"
 // You can also access additional data in database hooks
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx.path === "/callback/:id") {
            const additionalData = await getOAuthState<{ referredFrom?: string }>();
            if (additionalData?.referredFrom) {
              return {
                data: {
                  referredFrom: additionalData.referredFrom,
                },
              };
            }
          }
        },
      },
    },
  },
```

<Callout>
  By default OAuth state includes the following data:

  * `callbackURL` - the callback URL for the OAuth flow
  * `codeVerifier` - the code verifier for the OAuth flow
  * `errorURL` - the error URL for the OAuth flow
  * `newUserURL` - the new user URL for the OAuth flow
  * `link` - the link for the OAuth flow (email and user id)
  * `requestSignUp` - whether to request sign up for the OAuth flow
  * `expiresAt` - the expiration time of the OAuth state
  * `[key: string]`: any additional data you pass in the OAuth flow
</Callout>

## Handling Providers Without Email

Better Auth currently requires an email address on every user record. Most providers return one with the `email` scope, but several can legitimately omit it. When that happens the OAuth flow fails with `error=email_not_found` (or `error=email_is_missing` for the Generic OAuth plugin).

The table below summarises, for each affected provider, when `email` may be absent, which stable identifier you can use as a fallback in `mapProfileToUser`, and how much to trust the provider's `email_verified` signal.

| Provider           | When `email` may be absent                                                                                                                                               | Stable fallback ID                                  | `email_verified` trust                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apple              | Every sign-in after the first (Apple only emits `email` on the initial consent)                                                                                          | `profile.sub` (stable per Apple Team)               | Reliable; relay addresses are also flagged verified                                                                                                                 |
| Discord            | Phone-only accounts; `email` scope not granted                                                                                                                           | `profile.id` (snowflake)                            | Reliable (dedicated `verified` field)                                                                                                                               |
| Facebook           | No valid email on file, even with the `email` permission granted                                                                                                         | `profile.id` (app-scoped)                           | Unknown: Graph API exposes no per-email verification flag                                                                                                           |
| GitHub             | User has set email to private; GitHub App lacks the "Email addresses" permission                                                                                         | `profile.id` (numeric)                              | Reliable                                                                                                                                                            |
| LinkedIn           | No confirmed email on the member; `email` scope not granted                                                                                                              | `profile.sub` (pairwise per app)                    | Reliable when present                                                                                                                                               |
| Microsoft Entra ID | Managed users without a `mail` attribute, unless `email` is configured as an [optional claim](https://learn.microsoft.com/en-us/entra/identity-platform/optional-claims) | `profile.oid` plus `profile.tid` (or `profile.sub`) | **Untrustworthy**: Microsoft [explicitly warns](https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference) never to use for authorization |
| Roblox             | The default Roblox profile flow does not return an email; Better Auth currently falls back to `preferred_username`                                                       | `profile.sub` (Roblox user ID)                      | Unknown for the default profile flow                                                                                                                                |

### Synthesize a placeholder email with `mapProfileToUser`

Fall back to the provider's stable ID when the `email` field is null or absent:

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `${profile.id}@discord.placeholder.local`,
      }),
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `${profile.sub}@apple.placeholder.local`,
      }),
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      mapProfileToUser: (profile) => ({
        email: profile.email ?? `${profile.oid}@entra.placeholder.local`,
      }),
    },
  },
});
```

<Callout type="warn">
  Synthesized emails are placeholders, not contact addresses. Plugins that send mail (password reset, magic link, email verification, organization invites) cannot deliver to them. Use a domain you control, or a reserved suffix like `.invalid` or `.local`, so no real inbox is ever addressed by mistake.
</Callout>

### Provider-specific notes

* **Apple**: persist the email the first time you see it. Apple provides no user-info endpoint, so if you don't store it on first sign-in you cannot retrieve it later. Both `email_verified` and `is_private_email` are serialized as **strings** (`"true"` / `"false"`), not booleans.
* **GitHub**: the `user:email` scope is requested by default. Private emails still return `null` on `/user`; the primary verified address is available at [`/user/emails`](https://docs.github.com/en/rest/users/emails).
* **Microsoft Entra ID**: because `email` is tenant-mutable and never verified, use `profile.oid` (immutable, stable within the tenant) as the identity anchor; treat `email` as a profile attribute only. Microsoft's [claims validation guidance](https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation) explicitly warns never to use `email`, `preferred_username`, or `unique_name` for authorization decisions.
* **Facebook**: without a per-email verification flag, treat every Facebook email as unverified unless you run your own verification challenge.

First-class support for emailless users, using the stable `(providerId, accountId)` pair as the identity key (in line with [OpenID Connect Core §5.7](https://openid.net/specs/openid-connect-core-1_0.html#ClaimStability)), is tracked in [#9124](https://github.com/better-auth/better-auth/issues/9124).

## Provider Options

### clientId

The OAuth 2.0 Client ID issued by the provider.

For providers that verify ID tokens by audience (Google, Apple, Microsoft Entra, Facebook, Cognito), you can pass an array to accept tokens issued for any of the configured clients. The first entry is used when Better Auth drives the authorization code flow; all entries are accepted when verifying an ID token's `aud` claim. This enables cross-platform sign-in (Web, iOS, Android) with a single backend configuration, where each platform's native SDK issues tokens under its own Client ID.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: [
        process.env.GOOGLE_WEB_CLIENT_ID as string,
        process.env.GOOGLE_IOS_CLIENT_ID as string,
        process.env.GOOGLE_ANDROID_CLIENT_ID as string,
      ],
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
```

All Client IDs must live in the same provider project so consent is shared. For providers that don't verify ID tokens by audience, only a single string is accepted.

### scope

The scope of the access request. For example, `email` or `profile`.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      scope: ["email", "profile"],
    },
  },
});
```

### redirectURI

Custom redirect URI for the provider. By default, it uses `/api/auth/callback/${providerName}`

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      redirectURI: "https://your-app.com/auth/callback",
    },
  },
});
```

### disableSignUp

Disables sign-up for new users.

### disableIdTokenSignIn

Disables the use of the ID token for sign-in. By default, it's enabled for some providers like Google and Apple.

### verifyIdToken

A custom function to verify the ID token. Receives the token, an optional nonce, and the request endpoint context so you can branch on headers or other request data.

<Callout type="warn">
  Providing `verifyIdToken` **replaces** the provider's built-in verification (signature, issuer, audience, and expiry). Your callback must perform those checks itself. Client-supplied headers such as `x-platform` are attacker-controlled — use them only to select which audience (or other claim) to verify against, not as proof of identity on their own.
</Callout>

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { createRemoteJWKSet, jwtVerify } from "jose";

const appleJwks = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

export const auth = betterAuth({
  socialProviders: {
    apple: {
      clientId: "YOUR_APPLE_CLIENT_ID",
      clientSecret: "YOUR_APPLE_CLIENT_SECRET",
      verifyIdToken: async (token, nonce, ctx) => {
        // Select audience from the request, then cryptographically verify.
        const audience =
          ctx?.headers?.get("x-platform") === "ios"
            ? process.env.APPLE_APP_BUNDLE_IDENTIFIER!
            : process.env.APPLE_CLIENT_ID!;
        try {
          const { payload } = await jwtVerify(token, appleJwks, {
            issuer: "https://appleid.apple.com",
            audience,
            maxTokenAge: "1h",
          });
          if (nonce && payload.nonce !== nonce) {
            return false;
          }
          return true;
        } catch {
          return false;
        }
      },
    },
  },
});
```

### overrideUserInfoOnSignIn

A boolean value that determines whether to override the user information in the database when signing in. By default, it is set to `false`, meaning that the user information will not be overridden during sign-in. If you want to update the user information every time they sign in, set this to `true`.

### mapProfileToUser

Use `mapProfileToUser` to change the default user mapping or populate additional user fields from the provider profile.

Better Auth treats the function's return value as provider input, even though the function runs on your server. It applies the input rules from `user.additionalFields` during OAuth sign-up, sign-in profile override, and account-link profile sync. Mapped fields that allow input are parsed and stored, while mapped values for fields marked `input: false` are ignored.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      mapProfileToUser: (profile) => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
  },
});
```

<Callout type="info">
  Declare mapped fields in the `user.additionalFields`
  [option](/docs/concepts/database#extending-core-schema) and allow those fields
  as input. The same rule applies to stateless auth setups.
</Callout>

#### Server-Owned Fields and Authorization Claims

Keep security-sensitive fields such as roles, bans, internal flags, and organization membership at `input: false`. Do not enable input only so `mapProfileToUser` can persist a provider claim, because the same setting also lets generic sign-up and user-update requests supply that field.

`input` and `returned` control separate directions. For example, `{ input: false, returned: true }` defines a readable server-owned field. API input and `mapProfileToUser` cannot supply it, but Better Auth includes its stored value in responses.

If a provider claim controls who may sign in, enforce the policy before Better Auth completes OAuth sign-in. Do not defer the check until after sign-in, because Better Auth may already have issued a valid session. Prefer a provider-specific option when one exists, such as the Google provider's [`hd` option](/docs/authentication/google#restrict-sign-in-to-google-workspace) for a Google Workspace domain. For flows that invoke [`getUserInfo`](/docs/concepts/oauth#getuserinfo), a custom implementation can verify the provider response and return `null` when the policy fails. Configure equivalent enforcement for separate sign-in paths that do not invoke `getUserInfo`.

If you also need to store the verified claim, keep the field at `input: false` and write it with your application's database layer. Use `defaultValue` only for a static value that applies to every user created through that auth configuration, not for a value derived from a provider profile.

### refreshAccessToken

A custom function to refresh the token. This feature is only supported for built-in social providers (Google, Facebook, GitHub, etc.) and is not currently supported for custom OAuth providers configured through the Generic OAuth Plugin. For built-in providers, you can provide a custom function to refresh the token if needed.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      refreshAccessToken: async (token) => {
        return {
          accessToken: "new-access-token",
          refreshToken: "new-refresh-token",
        };
      },
    },
  },
});
```

### clientKey

The client key of your application. This is used by TikTok Social Provider instead of `clientId`.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    tiktok: {
      clientKey: "YOUR_TIKTOK_CLIENT_KEY",
      clientSecret: "YOUR_TIKTOK_CLIENT_SECRET",
    },
  },
});
```

### getUserInfo

A custom function to get user info from the provider. This allows you to override the default user info retrieval process.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      getUserInfo: async (token) => {
        // Custom implementation to get user info
        const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        });
        const profile = await response.json();
        return {
          user: {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            emailVerified: profile.verified_email,
          },
          data: profile,
        };
      },
    },
  },
});
```

### disableImplicitSignUp

Disables implicit sign up for new users. When set to true for the provider, sign-in needs to be called with `requestSignUp` as true to create new users.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      disableImplicitSignUp: true,
    },
  },
});
```

### prompt

The prompt to use for the authorization code request. This controls the authentication flow behavior.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      prompt: "select_account", // or "consent", "login", "none", "select_account+consent"
    },
  },
});
```

### responseMode

The response mode to use for the authorization code request. This determines how the authorization response is returned.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      responseMode: "query", // or "form_post"
    },
  },
});
```

### disableDefaultScope

Removes the default scopes of the provider. By default, providers include certain scopes like `email` and `profile`. Set this to `true` to remove these default scopes and use only the scopes you specify.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Other configurations...
  socialProviders: {
    google: {
      clientId: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      disableDefaultScope: true,
      scope: ["https://www.googleapis.com/auth/userinfo.email"], // Only this scope will be used
    },
  },
});
```

### Other Provider Configurations

Each provider may have additional options, check the specific provider documentation for more details.
---
title: Session Management
description: Learn about session management in Better Auth, including session expiration, freshness, cookie caching strategies, secondary storage, stateless sessions, and customizing session responses.
---

Better Auth manages session using a traditional cookie-based session management. The session is stored in a cookie and is sent to the server on every request. The server then verifies the session and returns the user data if the session is valid.

## Session table

The session table stores the session data. The session table has the following fields:

* `id`: Unique identifier for the session.
* `token`: The session token. Which is also used as the session cookie.
* `userId`: The user ID of the user.
* `expiresAt`: The expiration date of the session.
* `ipAddress`: The IP address of the user.
* `userAgent`: The user agent of the user. It stores the user agent header from the request.

## Session Expiration

The session expires after 7 days by default. But whenever the session is used and the `updateAge` is reached, the session expiration is updated to the current time plus the `expiresIn` value.

You can change both the `expiresIn` and `updateAge` values by passing the `session` object to the `auth` configuration.

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    //... other config options
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24 // 1 day (every 1 day the session expiration is updated)
    }
})
```

### Disable Session Refresh

You can disable session refresh so that the session is not updated regardless of the `updateAge` option.

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    //... other config options
    session: {
        disableSessionRefresh: true
    }
})
```

### Defer Session Refresh

By default, `GET /get-session` performs database writes to refresh the session. This can cause issues with read-replica database setups where GET requests are routed to read-only replicas.

When enabled, GET becomes read-only and returns `needsRefresh: true` when refresh is needed. The client automatically calls POST to perform the refresh.

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    session: {
        deferSessionRefresh: true
    }
})
```

## Session Freshness

Some endpoints in Better Auth require the session to be **fresh**. A session is considered fresh if its `createdAt` is within the `freshAge` limit. By default, the `freshAge` is set to **1 day** (60 \* 60 \* 24).

You can customize the `freshAge` value by passing a `session` object in the `auth` configuration:

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    //... other config options
    session: {
        freshAge: 60 * 5 // 5 minutes (the session is fresh if created within the last 5 minutes)
    }
})
```

To **disable the freshness check**, set `freshAge` to `0`:

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    //... other config options
    session: {
        freshAge: 0 // Disable freshness check
    }
})
```

## Session Management

Better Auth provides a set of functions to manage sessions.

### Get Session

The `getSession` function retrieves the current active session.

```ts
import { authClient } from "@/lib/auth-client"

const { data: session } = await authClient.getSession()
```

To learn how to customize the session response check the [Customizing Session Response](#customizing-session-response) section.

### Use Session

The `useSession` action provides a reactive way to access the current session.

```ts title="auth-client.ts"
import { authClient } from "@/lib/auth-client"

const { data: session } = authClient.useSession()
```

### List Sessions

The `listSessions` function returns a list of sessions that are active for the user.

```ts title="auth-client.ts"
import { authClient } from "@/lib/auth-client"

const sessions = await authClient.listSessions()
```

### Revoke Session

When a user signs out of a device, the session is automatically ended. However, you can also end a session manually from any device the user is signed into.

To end a session, use the `revokeSession` function. Just pass the session token as a parameter.

```ts title="auth-client.ts"
import { authClient } from "@/lib/auth-client"

await authClient.revokeSession({
    token: "session-token"
})
```

### Revoke Other Sessions

To revoke all other sessions except the current session, you can use the `revokeOtherSessions` function.

```ts title="auth-client.ts"
import { authClient } from "@/lib/auth-client"

await authClient.revokeOtherSessions()
```

### Revoke All Sessions

To revoke all sessions, you can use the `revokeSessions` function.

```ts title="auth-client.ts"
import { authClient } from "@/lib/auth-client"

await authClient.revokeSessions()
```

### Update Session

If you have [additional fields](/docs/concepts/database#extending-core-schema) configured on the session, you can update them using the `updateSession` function.

```ts title="auth-client.ts"
import { authClient } from "@/lib/auth-client"

await authClient.updateSession({
    theme: "dark",
    language: "en",
})
```

Core session fields (`token`, `userId`, `expiresAt`, `createdAt`, `updatedAt`, `ipAddress`, `userAgent`) cannot be updated through this endpoint. Only custom additional fields are allowed.

On the server:

```ts title="server.ts"
await auth.api.updateSession({
    body: {
        theme: "dark",
    },
    headers: await headers() // headers containing the user's session token
});
```

### Revoking Sessions on Password Change

You can revoke all sessions when the user changes their password by passing `revokeOtherSessions` as true on `changePassword` function.

```ts title="auth.ts"
import { authClient } from "@/lib/auth-client"

await authClient.changePassword({
    newPassword: newPassword,
    currentPassword: currentPassword,
    revokeOtherSessions: true,
})
```

## Session Caching

### Cookie Cache

Calling your database every time `useSession` or `getSession` is invoked isn't ideal, especially if sessions don't change frequently. Cookie caching handles this by storing session data in a short-lived, signed cookie—similar to how JWT access tokens are used with refresh tokens.

When cookie caching is enabled, the server can check session validity from the cookie itself instead of hitting the database each time. The cookie is signed to prevent tampering, and a short `maxAge` ensures that the session data gets refreshed regularly. If a session is revoked or expires, the cookie will be invalidated automatically.

To turn on cookie caching, just set `session.cookieCache` in your auth config:

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache duration in seconds (5 minutes)
        }
    }
});
```

<Callout type="info">
  **Notes**

  When `cookieCache` is enabled, revoked sessions may remain active on other devices until the cookie cache expires (`maxAge`). This is because:

  * Cookie cache stores session data in the client's browser
  * The server cannot directly delete cookies from other devices
  * Sessions are only revalidated when the cache expires or `disableCookieCache: true` is used

  **If immediate session revocation is critical:**

  * Disable `cookieCache` entirely, or
  * Set a shorter `maxAge` (e.g. 60 seconds), or
  * Use `disableCookieCache: true` for sensitive operations
</Callout>

#### Cookie Cache Strategies

Better Auth supports three different encoding strategies for cookie cache:

* **`compact`** (default): Uses base64url encoding with HMAC-SHA256 signature. Most compact format with no JWT spec overhead. Best for performance and size.
* **`jwt`**: Standard JWT with HMAC-SHA256 signature (HS256). Signed but not encrypted - readable by anyone but tamper-proof. Follows JWT spec for interoperability.
* **`jwe`**: Uses JWE (JSON Web Encryption) with A256CBC-HS512 and HKDF key derivation. Fully encrypted tokens - neither readable nor tamperable. Most secure but largest size.

**Comparison:**

| Strategy  | Size     | Security         | Readable | Interoperable | Use Case                                      |
| --------- | -------- | ---------------- | -------- | ------------- | --------------------------------------------- |
| `compact` | Smallest | Good (signed)    | Yes      | No            | Performance-critical, internal use            |
| `jwt`     | Medium   | Good (signed)    | Yes      | Yes           | Need JWT compatibility, external integrations |
| `jwe`     | Largest  | Best (encrypted) | No       | Yes           | Sensitive data, maximum security              |

```ts title="auth.ts"
export const auth = betterAuth({
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
            strategy: "compact" // or "jwt" or "jwe"
        }
    }
});
```

**Note:** All strategies are cryptographically secure and prevent tampering. The main differences are size, readability, and JWT spec compliance.

**When to use each:**

* **Use `compact`** when you need maximum performance and smallest cookie size. Best for most applications where cookies are only used internally by Better Auth.
* **Use `jwt`** when you need JWT compatibility for external systems, or when you want standard JWT tokens that can be verified by third-party tools. The tokens are readable (base64-encoded JSON) but tamper-proof.
* **Use `jwe`** when you need maximum security and want to hide session data from the client. The tokens are fully encrypted and cannot be read without the secret key. Use this for sensitive data or compliance requirements.

If you want to disable returning from the cookie cache when fetching the session, you can pass `disableCookieCache:true` this will force the server to fetch the session from the database and also refresh the cookie cache.

```ts title="auth-client.ts"
import { authClient } from "@/lib/auth-client"

const session = await authClient.getSession({ query: {
    disableCookieCache: true
}})
```

or on the server

```ts title="server.ts"
await auth.api.getSession({
    query: {
        disableCookieCache: true,
    }, 
    headers: await headers() // headers containing the user's session token
});
```

## Sessions in Secondary Storage

By default, if you provide a [secondary storage](/docs/concepts/database#secondary-storage) in your auth configuration, the session will be stored in the secondary storage.

```ts
import { betterAuth } from "better-auth";

betterAuth({
  // ... other options
  secondaryStorage: {
    // Your implementation here
  },
});
```

### Storing Sessions in the Database

By default, Better Auth already stores sessions in the database, however if you provide a secondary storage,
Better Auth will store sessions in the secondary storage instead of the database.

You can choose to store sessions in the database instead of secondary storage by passing
`storeSessionInDatabase: true` in the session configuration.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    secondaryStorage: { /** your secondary storage implementation here */ },
    session: { // [!code highlight]
        storeSessionInDatabase: true, // [!code highlight]
    } // [!code highlight]
});
```

### Preserving Sessions

When a session is revoked, it will be removed from the secondary storage, however if you enable `preserveSessionInDatabase`,
the session will be preserved in the database and not be deleted.

This is useful if you want to keep track of the sessions that have been revoked.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    secondaryStorage: { /** your secondary storage implementation here */ },
    session: { // [!code highlight]
        preserveSessionInDatabase: true, // [!code highlight]
    } // [!code highlight]
});
```

## Stateless Session Management

Better Auth supports stateless session management without any database. This means that the session data is stored in a signed/encrypted cookie and the server never queries a database to validate sessions - it simply verifies the cookie signature and checks expiration.

### Basic Stateless Setup

If you don't pass a database configuration, Better Auth will automatically enable stateless mode.

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    // No database configuration
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
});
```

To manually enable stateless mode, you need to configure `cookieCache` and `account` with the following options:

```ts title="auth.ts"
import { betterAuth } from "better-auth"

export const auth = betterAuth({
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 7 * 24 * 60 * 60, // 7 days cache duration
            strategy: "jwe", // can be "jwt" or "compact"
            refreshCache: true, // Enable stateless refresh
        },
    },
    account: {
        storeStateStrategy: "cookie",
        storeAccountCookie: true, // Store provider account data after OAuth flow in an encrypted cookie
    }
});
```

<Callout type="info">
  If you don't provide a database, by default we provide the above configuration for you.
</Callout>

In stateless OAuth flows, `storeAccountCookie` stores provider account data, including OAuth token material, in the encrypted `account_data` cookie. `getAccessToken` can refresh expired provider access tokens when the account cookie contains a refresh token and a known access-token expiry. Token refresh responses set an updated account cookie, so server-side integrations must forward the returned `Set-Cookie` header to the browser.

Better Auth chunks oversized account cookies, but browsers and proxies can still enforce total cookie or header limits. Use database-backed account storage for providers that issue large JWTs or for production flows that need durable token storage.

### Understanding `refreshCache`

The `refreshCache` option controls automatic cookie refresh **before expiry** without querying any database:

* **`false`** (default): No automatic refresh. When the cookie cache expires (reaches `maxAge`), it will attempt to fetch from the database if available.
* **`true`**: Enable automatic refresh with default settings. Refreshes when 80% of `maxAge` is reached (20% time remaining).
* **`object`**: Custom refresh configuration with `updateAge` property.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 300, // 5 minutes
            refreshCache: {
                updateAge: 60 // Refresh when 60 seconds remain before expiry
            }
        }
    }
});
```

### Versioning Stateless Sessions

One of the biggest drawbacks of stateless sessions is that you can't invalidate session easily. To solve this with better auth, if you would like to invalidate all sessions, you can change the version of the cookie cache and re-deploy your application.

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
    session: {
        cookieCache: {
            version: "2", // [!code highlight] Change the version to invalidate all sessions
        }
    }
});
```

<Callout type="warning">
  This will invalidate all sessions that don't match the new version.
</Callout>

### Stateless with Secondary Storage

You can combine stateless sessions with secondary storage (Redis, etc.) for the best of both worlds:

```ts title="auth.ts"
import { betterAuth } from "better-auth"
import { redis } from "./redis"

export const auth = betterAuth({
    // No primary database needed
    secondaryStorage: {
        get: async (key) => await redis.get(key),
        set: async (key, value, ttl) => await redis.set(key, value, "EX", ttl),
        delete: async (key) => await redis.del(key)
    },
    session: {
        cookieCache: {
            maxAge: 5 * 60, // [!code highlight] 5 minutes (short-lived cookie)
            refreshCache: false // [!code highlight] Disable stateless refresh
        }
    }
});
```

This setup:

* Uses cookies for session validation (no DB queries)
* Uses Redis for storing session data and refreshing the cookie cache before expiry
* You can revoke sessions from the secondary storage and the cookie cache will be invalidated on refresh

## Customizing Session Response

When you call `getSession` or `useSession`, the session data is returned as a `user` and `session` object. You can customize this response using the `customSession` plugin.

```ts title="auth.ts"
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [
        customSession(async ({ user, session }) => {
            const roles = findUserRoles(session.session.userId);
            return {
                roles,
                user: {
                    ...user,
                    newField: "newField",
                },
                session
            };
        }),
    ],
});
```

This will add `roles` and `user.newField` to the session response.

**Infer on the Client**

```ts title="auth-client.ts"
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth"; // Import the auth instance as a type

const authClient = createAuthClient({
    plugins: [customSessionClient<typeof auth>()],
});

const { data } = authClient.useSession();
const { data: sessionData } = await authClient.getSession();
// data.roles
// data.user.newField
```

### Caveats on Customizing Session Response

1. The passed `session` object to the callback does not infer fields added by plugins.

However, as a workaround, you can pull up your auth options and pass it to the plugin to infer the fields.

```ts
import { betterAuth, BetterAuthOptions } from "better-auth";

const options = {
  //...config options
  plugins: [
    //...plugins 
  ]
} satisfies BetterAuthOptions;

export const auth = betterAuth({
    ...options,
    plugins: [
        ...(options.plugins ?? []),
        customSession(async ({ user, session }, ctx) => {
            // now both user and session will infer the fields added by plugins and your custom fields
            return {
                user,
                session
            }
        }, options), // pass options here  // [!code highlight]
    ]
})
```

2. When your server and client code are in separate projects or repositories, and you cannot import the `auth` instance as a type reference, type inference for custom session fields will not work on the client side.
3. Session caching, including secondary storage or cookie cache, does not include custom fields. Each time the session is fetched, your custom session function will be called.

**Mutating the list-device-sessions endpoint**
The `/multi-session/list-device-sessions` endpoint from the [multi-session](/docs/plugins/multi-session) plugin is used to list the devices that the user is signed into.

You can mutate the response of this endpoint by passing the `shouldMutateListDeviceSessionsEndpoint` option to the `customSession` plugin.

By default, we do not mutate the response of this endpoint.

```ts title="auth.ts"
import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
    plugins: [
        customSession(async ({ user, session }, ctx) => {
            return {
                user,
                session
            }
        }, {}, { shouldMutateListDeviceSessionsEndpoint: true }), // [!code highlight]
    ],
});
```
---
title: TypeScript
description: Learn about TypeScript configuration for Better Auth, including strict mode, inferring types for sessions and users, defining additional fields, and inferring additional fields on the client.
---

Better Auth is designed to be type-safe. Both the client and server are built with TypeScript, allowing you to easily infer types.

## TypeScript Config

### Strict Mode

Better Auth is designed to work with TypeScript's strict mode. We recommend enabling strict mode in your TypeScript config file:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "strict": true
  }
}
```

if you can't set `strict` to `true`, you can enable `strictNullChecks`:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "strictNullChecks": true,
  }
}
```

When `strict` is `true`, `strictNullChecks` is enabled as well. If you explicitly set `strictNullChecks` to `false`, type inference issues could occur.

<Callout type="warn">
  If you're running into issues with TypeScript inference exceeding maximum length the compiler will serialize,
  then please make sure you're following the instructions above, as well as ensuring that both `declaration` and `composite` are not enabled.
</Callout>

## Inferring Types

Both the client SDK and the server offer types that can be inferred using the `$Infer` property. Plugins can extend base types like `User` and `Session`, and you can use `$Infer` to infer these types. Additionally, plugins can provide extra types that can also be inferred through `$Infer`.

```ts title="auth-client.ts" 
import { createAuthClient } from "better-auth/client"

const authClient = createAuthClient()

export type Session = typeof authClient.$Infer.Session
```

The `Session` type includes both `session` and `user` properties. The user property represents the user object type, and the `session` property represents the `session` object type.

You can also infer types on the server side.

```ts title="auth.ts" 
import { betterAuth } from "better-auth"
import Database from "better-sqlite3"

export const auth = betterAuth({
    database: new Database("database.db")
})

type Session = typeof auth.$Infer.Session
```

## Additional Fields

Better Auth allows you to add additional fields to the user and session objects. All additional fields are properly inferred and available on the server and client side.

```ts title="auth.ts"
import { betterAuth } from "better-auth"
import Database from "better-sqlite3"

export const auth = betterAuth({
    database: new Database("database.db"),
    user: {
       additionalFields: {
          role: {
              type: "string",
              input: false
            } 
        }
    }
   
})

type Session = typeof auth.$Infer.Session
```

In the example above, we added a `role` field to the user object. This field is now available on the `Session` type.

### The `input` property

The `input` property in an additional field configuration determines whether the field should be included in the user input. This property defaults to `true`, meaning the field will be part of the user input during operations like registration.

To prevent a field from being part of the user input, you must explicitly set `input: false`:

```ts
additionalFields: {
    role: {
        type: "string",
        input: false
    }
}
```

When `input` is set to `false`, the field will be excluded from user input, preventing users from passing a value for it.

By default, additional fields are included in the user input, which can lead to security vulnerabilities if not handled carefully. For fields that should not be set by the user, like a `role`, it is crucial to set `input: false` in the configuration.

### Inferring Additional Fields on Client

To make sure proper type inference for additional fields on the client side, you need to inform the client about these fields. There are two approaches to achieve this, depending on your project structure:

1. For Monorepo or Single-Project Setups

If your server and client code reside in the same project, you can use the `inferAdditionalFields` plugin to automatically infer the additional fields from your server configuration.

```ts title="auth-client.ts"
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/client";
import type { auth } from "@/lib/auth"; // Import the auth instance as a type

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
```

2. For Separate Client-Server Projects

If your client and server are in separate projects, you'll need to manually specify the additional fields when creating the auth client.

```ts title="auth-client.ts"
import { createAuthClient } from "better-auth/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({
      user: {
        role: {
          type: "string"
        }
      }
  })],
});
```
