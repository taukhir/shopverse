# ShopVerse Postman collection

Import these two files into Postman:

- `ShopVerse.postman_collection.json`
- `ShopVerse-Local.postman_environment.json`

Select **ShopVerse - Local**, start the platform, fill the secret password
variables from your local setup, and run either **Login as admin** or **Login as
customer**. Login scripts save the JWT automatically.
Requests that create an order, user, address, role, or permission save useful
IDs back into the environment.

The collection uses the API gateway at `http://localhost:8080` for normal
traffic and direct service URLs only for operations that are not gateway-routed.
In particular, public customer registration currently targets user-service at
port `8082` because `cloud-configs/API-GATEWAY.yml` does not route
`/api/v1/public/**`.

The environment intentionally contains no passwords. Never export populated
token values or real credentials. Requests named **Delete**, **Replay**, **Refund**,
**Reconcile**, or lifecycle transitions change state and should be sent
deliberately rather than run as a full collection.

Regenerate the JSON after changing this source definition:

```powershell
node .\postman\generate-shopverse-postman.mjs
```
