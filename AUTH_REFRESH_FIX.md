# Authentication Refresh Fix

## The Problem

After a user logged in successfully, refreshing the page sent the user back to the login page.

This happened because React state is stored in memory. When the browser refreshes the page, React starts again and the `user` state is initially empty:

```js
user = null
```

The application must then ask the backend whether the browser still has a valid authentication cookie. That request is made to:

```text
GET http://localhost:3000/api/auth/get-me
```

If that request succeeds, the current user is restored. If it fails, the protected route redirects to `/login`.

## How The Redirect Happened

The protected route uses this logic:

```jsx
if (loading) {
  return <p>Loading...</p>;
}

if (!user) {
  return <Navigate to="/login" replace />;
}
```

The redirect is correct when the user is genuinely unauthenticated. The problem was that the restore request was failing or being handled incorrectly, so the application interpreted a temporary restore problem as a logged-out user.

## Problems Found

### 1. The original `useEffect` ran after every render

The original hook contained an effect without a dependency array:

```js
useEffect(() => {
  getandsetuser();
});
```

Without a dependency array, React runs the effect after every render. The effect then called `setUser()` and `setLoading()`, which caused another render. That render started another request, and the cycle continued.

This could cause:

- Repeated `/get-me` requests.
- Repeated state updates.
- Race conditions between requests.
- The user being replaced with `null` after another request failed.

### 2. The effect was inside `useAuth`

The restore effect was inside the `useAuth` hook. Multiple components use that hook, including the login page and protected pages.

That means more than one component could start its own session-restore request. The requests could finish in a different order and overwrite the shared user state.

Session restoration belongs in `AuthProvider`, because the provider owns the shared authentication state and is mounted once around the router.

### 3. `getme()` sent undefined values

The original API helper called the endpoint like this:

```js
api.get('/get-me', { username, email })
```

`username` and `email` did not exist in that function. The `/get-me` endpoint does not need them anyway. It identifies the user from the authentication cookie.

The request was changed to:

```js
api.get('/get-me')
```

### 4. `getme()` did not await Axios

The original function did not await the Axios request:

```js
const response = api.get('/get-me');
```

That returns a Promise rather than the response object. It was changed to:

```js
const response = await api.get('/get-me');
```

### 5. The response contains a `user` property

The backend returns this shape:

```json
{
  "user": {
    "id": "...",
    "username": "...",
    "email": "..."
  }
}
```

The frontend originally stored the entire response object. The correct value is:

```js
setUser(data.user);
```

### 6. The browser reported a `304` response

The `/get-me` request was observed with status `304 Not Modified`.

A `304` is a cache-validation response. It does not contain a normal response body. Axios normally considers only `2xx` responses successful, so a `304` can be treated as a rejected request. The catch block then ran `setUser(null)`, and the protected route redirected to `/login`.

The original request used:

```js
'Cache-Control': 'no-cache'
```

`no-cache` still allows the browser to revalidate a cached response, which can produce `304`.

The request now uses:

```js
'Cache-Control': 'no-store'
```

The backend auth routes also send:

```text
Cache-Control: no-store
```

This prevents authentication responses from being stored or reused from cache.

## The Fix

### AuthProvider restores the session once

`AuthProvider` now starts with loading enabled:

```js
const [loading, setLoading] = useState(true);
```

It restores the user once when the provider mounts:

```js
useEffect(() => {
  const restoreUser = async () => {
    try {
      const data = await getme();
      setUser(data.user);
    } catch (err) {
      setUser(null);
      console.log('Failed to restore the authenticated user:', err);
    } finally {
      setLoading(false);
    }
  };

  restoreUser();
}, []);
```

The empty dependency array means the restore operation starts once for that provider instance. While it is running, protected pages show a loading state instead of redirecting.

### `useAuth` now only exposes auth actions and state

The `useAuth` hook no longer performs the initial restore request. It reads the state from `AuthContext` and provides actions such as:

- Register.
- Login.
- Logout.

This avoids duplicate restore requests from different components.

### The API preserves errors

The `login`, `logout`, and `getme` functions now rethrow request errors after logging them. This lets the calling hook or provider handle failures instead of accidentally receiving `undefined` and trying to read `response.user`.

## Expected Request Flow

### Successful refresh

1. The browser refreshes the page.
2. React creates `AuthProvider` with `user = null` and `loading = true`.
3. `AuthProvider` calls `/api/auth/get-me` with credentials.
4. The browser sends the existing `token` cookie.
5. The backend verifies the token.
6. The backend returns `200` with `{ user }`.
7. The provider stores `data.user`.
8. The provider changes `loading` to `false`.
9. The protected page renders instead of redirecting.

### Refresh without a valid cookie

1. The browser refreshes the page.
2. The provider calls `/get-me`.
3. The backend returns `401` because there is no valid token.
4. The provider stores `null` and finishes loading.
5. The protected route correctly redirects to `/login`.

## Files Changed

- `frontend/src/auth/auth.context.jsx`
  - Restores the session once from the provider.
  - Starts with loading enabled.

- `frontend/src/auth/useauth.js`
  - No longer restores the session from every hook consumer.
  - Continues to provide login, register, and logout actions.

- `frontend/src/auth/services/auth.api.js`
  - Awaits the `/get-me` request.
  - Removes undefined request values.
  - Uses `Cache-Control: no-store`.
  - Rethrows API errors.

- `Backend/src/app.js`
  - Adds `Cache-Control: no-store` to auth responses.

## How To Verify The Fix

1. Start the backend.
2. Start the frontend.
3. Log in.
4. Open browser DevTools.
5. Refresh the protected page.
6. Open the Network tab.
7. Inspect `/api/auth/get-me`.
8. Confirm that it returns `200`, not `304`.
9. Confirm that the response contains a `user` property.
10. Confirm that the page stays on the protected route.

The browser should also contain a `token` cookie for the backend host. If `/get-me` returns `401`, the cookie is missing, expired, or not being sent with the request. The Axios client uses `withCredentials: true`, and the backend CORS configuration allows credentials from `http://localhost:5173`.

## Validation Results

The frontend production build passed:

```text
vite build
✓ built successfully
```

The changed frontend auth files were also checked with ESLint. The project still has an unrelated Fast Refresh lint rule in `auth.context.jsx` because that file exports both a context and a component. This does not prevent the production build or the authentication flow from working.

The backend entry files passed Node syntax checks.
